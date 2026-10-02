import os
import random
import string
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, HTTPException, Query, Request

from lib.booking_logic import (
    available_slots, blocked_full_days, blocking_bookings, booking_start, confirm_booking, credit_balance,
    get_settings, money, now_local, queue_message, to_hhmm, to_min,
)
from lib.db import db
from models.schemas import (
    Availability, Booking, BookingCreate, BookingPolicy, CheckoutResponse, CreditInfo, GalleryItem,
    RescheduleIn, Service, SettingsModel, TodayInfo,
)

router = APIRouter()
MP_API = "https://api.mercadopago.com"


def mp_token() -> str:
    return os.environ.get("MP_ACCESS_TOKEN", "").strip()


@router.get("/today", response_model=TodayInfo)
async def today():
    return TodayInfo(today=now_local().strftime("%Y-%m-%d"), payment_mode="mercadopago" if mp_token() else "demo")


@router.get("/settings", response_model=SettingsModel)
async def public_settings():
    return SettingsModel(**await get_settings())


@router.get("/services", response_model=list[Service])
async def list_services():
    docs = await db.services.find({"active": True}, {"_id": 0}).sort("price", 1).to_list(200)
    return [Service(**d) for d in docs]


@router.get("/availability", response_model=Availability)
async def availability(service_id: str, date: str, exclude: str | None = None):
    svc = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not svc or (not svc["active"] and not exclude):
        raise HTTPException(404, "Serviço não encontrado")
    is_open, slots = await available_slots(date, svc["duration"], exclude)
    return Availability(date=date, open=is_open, slots=slots)


@router.get("/blocked-days", response_model=list[str])
async def blocked_days():
    return await blocked_full_days(now_local().strftime("%Y-%m-%d"))


@router.get("/gallery", response_model=list[GalleryItem])
async def gallery():
    docs = await db.gallery.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [GalleryItem(**d) for d in docs]


@router.get("/credits", response_model=CreditInfo)
async def credits(whatsapp: str):
    return CreditInfo(balance=await credit_balance("".join(c for c in whatsapp if c.isdigit())))


@router.post("/bookings", response_model=Booking)
async def create_booking(body: BookingCreate):
    svc = await db.services.find_one({"id": body.service_id, "active": True}, {"_id": 0})
    if not svc:
        raise HTTPException(404, "Serviço não encontrado")
    _, slots = await available_slots(body.date, svc["duration"])
    if body.time not in slots:
        raise HTTPException(409, "Este horário não está mais disponível. Escolha outro.")
    settings = await get_settings()
    phone = "".join(c for c in body.client_whatsapp if c.isdigit())
    deposit = round(svc["price"] * settings.get("deposit_percent", 40) / 100, 2)
    credit = min(await credit_balance(phone), deposit)
    booking = Booking(
        code="BN-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6)),
        service_id=svc["id"],
        service_name=svc["name"],
        service_price=svc["price"],
        service_duration=svc["duration"],
        date=body.date,
        time=body.time,
        end_time=to_hhmm(to_min(body.time) + svc["duration"]),
        client_name=body.client_name.strip(),
        client_whatsapp=phone,
        client_email=(body.client_email or None),
        deposit_amount=round(deposit - credit, 2),
        credit_applied=credit,
        remaining_amount=round(svc["price"] - deposit, 2),
        hold_expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
    )
    await db.bookings.insert_one(booking.model_dump())
    if booking.deposit_amount <= 0:
        doc = await confirm_booking(booking.id, "CREDITO-" + booking.id[:8], "credito")
        return Booking(**doc)  # type: ignore[arg-type]
    return booking


async def _changeable(id: str) -> tuple[dict, dict]:
    doc = await db.bookings.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Agendamento não encontrado")
    settings = await get_settings()
    if doc["status"] != "confirmado":
        raise HTTPException(400, "Apenas agendamentos confirmados podem ser alterados")
    if booking_start(doc) - now_local() < timedelta(hours=settings["reschedule_hours"]):
        raise HTTPException(400, f"Alterações só são permitidas até {settings['reschedule_hours']}h antes do horário. Fale com a profissional pelo WhatsApp.")
    return doc, settings


@router.get("/bookings/{id}/policy", response_model=BookingPolicy)
async def booking_policy(id: str):
    doc = await db.bookings.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Agendamento não encontrado")
    hours = (await get_settings())["reschedule_hours"]
    deadline = booking_start(doc) - timedelta(hours=hours)
    return BookingPolicy(can_change=doc["status"] == "confirmado" and now_local() < deadline, deadline=deadline.isoformat(), hours=hours)


@router.post("/bookings/{id}/reschedule", response_model=Booking)
async def reschedule(id: str, body: RescheduleIn):
    doc, _ = await _changeable(id)
    _, slots = await available_slots(body.date, doc["service_duration"], exclude_id=id)
    if body.time not in slots:
        raise HTTPException(409, "Este horário não está disponível. Escolha outro.")
    upd = {"date": body.date, "time": body.time, "end_time": to_hhmm(to_min(body.time) + doc["service_duration"]), "reschedule_count": doc.get("reschedule_count", 0) + 1}
    await db.bookings.update_one({"id": id}, {"$set": upd})
    await db.messages.delete_many({"booking_id": id, "kind": {"$in": ["lembrete_dia", "lembrete_15min"]}, "status": "pendente"})
    doc.update(upd)
    await queue_message(doc, "remarcacao")
    return Booking(**doc)


@router.post("/bookings/{id}/cancel", response_model=Booking)
async def client_cancel(id: str):
    doc, _ = await _changeable(id)
    paid_cash = doc["deposit_amount"]
    total_credit = round(paid_cash + doc.get("credit_applied", 0), 2)
    await db.bookings.update_one({"id": id}, {"$set": {"status": "cancelado", "cancelled_by": "cliente"}})
    if paid_cash > 0:
        await db.credits.insert_one({"id": str(uuid.uuid4()), "phone": doc["client_whatsapp"], "amount": paid_cash, "source_booking_id": id, "created_at": datetime.now(timezone.utc)})
    doc.update(status="cancelado", cancelled_by="cliente")
    await queue_message(doc, "cancelamento", f"Seu sinal de {money(total_credit)} ficou como crédito para o próximo agendamento com este WhatsApp. 💕")
    return Booking(**doc)


@router.get("/bookings/{id}", response_model=Booking)
async def get_booking(id: str):
    doc = await db.bookings.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Agendamento não encontrado")
    return Booking(**doc)


async def _payable(id: str) -> dict:
    doc = await db.bookings.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Agendamento não encontrado")
    if doc["status"] != "aguardando_pagamento":
        raise HTTPException(400, "Este agendamento não está aguardando pagamento")
    if doc["id"] not in [b["id"] for b in await blocking_bookings(doc["date"])]:
        raise HTTPException(410, "A reserva do horário expirou. Faça um novo agendamento.")
    return doc


@router.post("/bookings/{id}/checkout", response_model=CheckoutResponse)
async def checkout(id: str, request: Request):
    doc = await _payable(id)
    token = mp_token()
    if not token:
        return CheckoutResponse(mode="demo", url=f"/pagamento/{id}")
    base = os.environ.get("PUBLIC_APP_URL") or str(request.base_url)
    base = base.rstrip("/")
    payload = {
        "items": [{"id": doc["service_id"], "title": f"Sinal 40% - {doc['service_name']}", "quantity": 1, "currency_id": "BRL", "unit_price": doc["deposit_amount"]}],
        "external_reference": id,
        "back_urls": {k: f"{base}/pagamento/resultado" for k in ("success", "failure", "pending")},
        "auto_return": "approved",
        "notification_url": f"{base}/api/payments/webhook",
    }
    async with httpx.AsyncClient(base_url=MP_API, timeout=15) as client:
        r = await client.post("/checkout/preferences", json=payload, headers={"Authorization": f"Bearer {token}"})
    if r.is_error:
        raise HTTPException(502, "Falha ao criar pagamento no Mercado Pago")
    return CheckoutResponse(mode="mercadopago", url=r.json()["init_point"])


@router.post("/bookings/{id}/demo-pay", response_model=Booking)
async def demo_pay(id: str):
    """MOCK payment approval — only available when no Mercado Pago token is configured."""
    if mp_token():
        raise HTTPException(403, "Pagamento de demonstração desativado")
    await _payable(id)
    doc = await confirm_booking(id, "DEMO-" + id[:8], "demo_pix")
    return Booking(**doc)  # type: ignore[arg-type]


async def _verify_mp_payment(payment_id: str) -> dict:
    async with httpx.AsyncClient(base_url=MP_API, timeout=15) as client:
        r = await client.get(f"/v1/payments/{payment_id}", headers={"Authorization": f"Bearer {mp_token()}"})
    if r.is_error:
        raise HTTPException(502, "Não foi possível verificar o pagamento")
    payment = r.json()
    booking_id = str(payment.get("external_reference") or "")
    doc = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if doc and payment.get("status") == "approved" and payment.get("currency_id") == "BRL" and abs(float(payment.get("transaction_amount", 0)) - doc["deposit_amount"]) < 0.01:
        await confirm_booking(booking_id, str(payment["id"]), "mercadopago")
    return payment


@router.get("/payments/return", response_model=Booking)
async def payment_return(payment_id: str = Query(...), external_reference: str = Query(...)):
    if not mp_token():
        raise HTTPException(400, "Mercado Pago não configurado")
    payment = await _verify_mp_payment(payment_id)
    if str(payment.get("external_reference")) != external_reference:
        raise HTTPException(400, "Pagamento não pertence a este agendamento")
    return await get_booking(external_reference)


@router.post("/payments/webhook")
async def payment_webhook(request: Request):
    if not mp_token():
        return {"received": True}
    payment_id = request.query_params.get("data.id")
    if not payment_id:
        try:
            body = await request.json()
            payment_id = str(body.get("data", {}).get("id", ""))
        except Exception:
            payment_id = ""
    if payment_id:
        try:
            await _verify_mp_payment(payment_id)
        except HTTPException:
            pass
    return {"received": True}
