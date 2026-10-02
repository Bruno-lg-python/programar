"""Availability, confirmation and WhatsApp (MOCK) message helpers."""

import os
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from lib.db import db
from models.schemas import Message

TZ = ZoneInfo(os.environ.get("APP_TZ", "America/Sao_Paulo"))
ACTIVE = ["confirmado", "concluido"]

DEFAULT_SETTINGS = {
    "business_name": "Bella Nails Studio",
    "professional_name": "Isabella Martins",
    "tagline": "Unhas impecáveis, cuidado de verdade.",
    "bio": "Nail designer há 8 anos, especialista em cutilagem russa, esmaltação em gel e spa dos pés. Atendimento exclusivo, com hora marcada e materiais 100% esterilizados.",
    "whatsapp": "11987654321",
    "instagram": "bellanails.studio",
    "address": "Rua Oscar Freire, 1200 - Sala 34",
    "city": "Jardins, São Paulo - SP",
    "photo_url": "https://images.unsplash.com/photo-1663229050022-10896e8ea58a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "service_info": "Atendimento individual com hora marcada. Para confirmar seu horário é cobrado um sinal de 40% do valor, o restante é pago no dia. Materiais esterilizados em autoclave e lixas descartáveis.",
    "slot_interval": 30,
    "deposit_percent": 40,
    "hours": [
        {"day": d, "open": d < 6, "start": "09:00", "end": "19:00"} for d in range(7)
    ],
}


async def get_settings() -> dict:
    doc = await db.settings.find_one({"_id": "main"}, {"_id": 0})
    if not doc:
        await db.settings.insert_one({"_id": "main", **DEFAULT_SETTINGS})
        return dict(DEFAULT_SETTINGS)
    return doc


def now_local() -> datetime:
    return datetime.now(TZ)


def to_min(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def to_hhmm(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


async def blocking_bookings(date: str, exclude_id: str | None = None) -> list[dict]:
    now = datetime.now(timezone.utc)
    docs = await db.bookings.find({"date": date, "status": {"$ne": "cancelado"}}, {"_id": 0}).to_list(500)
    out = []
    for b in docs:
        if b["id"] == exclude_id:
            continue
        if b["status"] == "aguardando_pagamento":
            exp = b["hold_expires_at"]
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp < now:
                continue
        out.append(b)
    return out


async def available_slots(date: str, duration: int) -> tuple[bool, list[str]]:
    settings = await get_settings()
    try:
        d = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        return False, []
    today = now_local()
    if d < today.date() or d > today.date() + timedelta(days=90):
        return False, []
    hours = next((h for h in settings["hours"] if h["day"] == d.weekday()), None)
    if not hours or not hours["open"]:
        return False, []
    start, end = to_min(hours["start"]), to_min(hours["end"])
    step = max(10, int(settings.get("slot_interval", 30)))
    busy = [(to_min(b["time"]), to_min(b["end_time"])) for b in await blocking_bookings(date)]
    min_start = today.hour * 60 + today.minute + 30 if d == today.date() else -1
    slots = []
    t = start
    while t + duration <= end:
        if t >= min_start and all(t + duration <= s or t >= e for s, e in busy):
            slots.append(to_hhmm(t))
        t += step
    return True, slots


def fmt_date(date: str) -> str:
    y, m, d = date.split("-")
    return f"{d}/{m}/{y}"


def money(v: float) -> str:
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


async def queue_message(booking: dict, kind: str) -> None:
    if await db.messages.find_one({"booking_id": booking["id"], "kind": kind}):
        return
    s = await get_settings()
    first = booking["client_name"].split(" ")[0]
    if kind == "confirmacao":
        text = (
            f"Olá, {first}! 💅 Seu horário no {s['business_name']} está CONFIRMADO.\n"
            f"Serviço: {booking['service_name']}\nData: {fmt_date(booking['date'])} às {booking['time']}\n"
            f"Sinal pago: {money(booking['deposit_amount'])} | Restante no dia: {money(booking['remaining_amount'])}\n"
            f"Endereço: {s['address']} - {s['city']}\nCódigo: {booking['code']}"
        )
    elif kind == "lembrete_dia":
        text = (
            f"Bom dia, {first}! ✨ Lembrete: hoje você tem {booking['service_name']} às {booking['time']} "
            f"no {s['business_name']} ({s['address']}). Te espero!"
        )
    else:
        text = f"Oi, {first}! Faltam 15 minutos para o seu horário das {booking['time']} ({booking['service_name']}). Até já! 💖"
    msg = Message(booking_id=booking["id"], kind=kind, phone=booking["client_whatsapp"], client_name=booking["client_name"], text=text)
    await db.messages.insert_one(msg.model_dump())


async def confirm_booking(booking_id: str, payment_id: str, method: str) -> dict | None:
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        return None
    if booking["status"] == "aguardando_pagamento":
        await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {"status": "confirmado", "payment_id": payment_id, "payment_method": method}},
        )
        booking.update(status="confirmado", payment_id=payment_id, payment_method=method)
        await queue_message(booking, "confirmacao")
        await process_reminders()
    return booking


async def process_reminders() -> None:
    """Queue day-of (from 08:00 or on confirmation day) and 15-minute reminders."""
    now = now_local()
    today = now.strftime("%Y-%m-%d")
    docs = await db.bookings.find({"date": today, "status": "confirmado"}, {"_id": 0}).to_list(500)
    for b in docs:
        start = datetime.strptime(f"{b['date']} {b['time']}", "%Y-%m-%d %H:%M").replace(tzinfo=TZ)
        if now >= start:
            continue
        if now.hour >= 8 or start - now < timedelta(hours=2):
            await queue_message(b, "lembrete_dia")
        if start - now <= timedelta(minutes=15):
            await queue_message(b, "lembrete_15min")
