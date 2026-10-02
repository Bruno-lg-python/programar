import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response

from lib.auth import COOKIE, make_token, require_admin
from lib.booking_logic import get_settings, now_local, process_reminders
from lib.db import db
from models.schemas import Block, BlockIn, Booking, BookingStatusUpdate, GalleryIn, GalleryItem, LoginIn, Message, OkOut, Service, ServiceIn, SettingsModel

router = APIRouter(prefix="/admin")
protected = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])


@router.post("/login", response_model=OkOut)
async def login(body: LoginIn, response: Response):
    if body.password != os.environ.get("ADMIN_PASSWORD", "admin123"):
        raise HTTPException(401, "Senha incorreta")
    response.set_cookie(COOKIE, make_token(), httponly=True, samesite="lax", secure=True, max_age=7 * 86400, path="/")
    return OkOut()


@router.post("/logout", response_model=OkOut)
async def logout(response: Response):
    response.delete_cookie(COOKIE, path="/")
    return OkOut()


@protected.get("/me", response_model=OkOut)
async def me():
    return OkOut()


# ---- bookings ----
@protected.get("/bookings", response_model=list[Booking])
async def list_bookings(date: Optional[str] = None, status: Optional[str] = None):
    q: dict = {}
    if date:
        q["date"] = date
    if status:
        q["status"] = status
    docs = await db.bookings.find(q, {"_id": 0}).sort([("date", 1), ("time", 1)]).to_list(1000)
    return [Booking(**d) for d in docs]


@protected.patch("/bookings/{id}", response_model=Booking)
async def update_booking(id: str, body: BookingStatusUpdate):
    res = await db.bookings.find_one_and_update({"id": id}, {"$set": {"status": body.status, **({"cancelled_by": "admin"} if body.status == "cancelado" else {})}}, projection={"_id": 0}, return_document=True)
    if not res:
        raise HTTPException(404, "Agendamento não encontrado")
    return Booking(**res)


# ---- services ----
@protected.get("/services", response_model=list[Service])
async def all_services():
    docs = await db.services.find({}, {"_id": 0}).sort("category", 1).to_list(500)
    return [Service(**d) for d in docs]


@protected.post("/services", response_model=Service)
async def create_service(body: ServiceIn):
    svc = Service(**body.model_dump())
    await db.services.insert_one(svc.model_dump())
    return svc


@protected.put("/services/{id}", response_model=Service)
async def update_service(id: str, body: ServiceIn):
    res = await db.services.find_one_and_update({"id": id}, {"$set": body.model_dump()}, projection={"_id": 0}, return_document=True)
    if not res:
        raise HTTPException(404, "Serviço não encontrado")
    return Service(**res)


@protected.delete("/services/{id}", response_model=OkOut)
async def delete_service(id: str):
    res = await db.services.delete_one({"id": id})
    if not res.deleted_count:
        raise HTTPException(404, "Serviço não encontrado")
    return OkOut()


# ---- messages (WhatsApp MOCK queue) ----
@protected.get("/messages", response_model=list[Message])
async def list_messages():
    await process_reminders()
    docs = await db.messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Message(**d) for d in docs]


@protected.patch("/messages/{id}/sent", response_model=Message)
async def mark_sent(id: str):
    res = await db.messages.find_one_and_update({"id": id}, {"$set": {"status": "enviada"}}, projection={"_id": 0}, return_document=True)
    if not res:
        raise HTTPException(404, "Mensagem não encontrada")
    return Message(**res)


# ---- schedule blocks ----
@protected.get("/blocks", response_model=list[Block])
async def list_blocks():
    docs = await db.blocks.find({"date": {"$gte": now_local().strftime("%Y-%m-%d")}}, {"_id": 0}).sort([("date", 1), ("start", 1)]).to_list(1000)
    return [Block(**d) for d in docs]


@protected.post("/blocks", response_model=Block)
async def create_block(body: BlockIn):
    if not body.all_day and body.start >= body.end:
        raise HTTPException(400, "O horário final deve ser depois do inicial")
    blk = Block(**body.model_dump())
    if blk.all_day:
        blk.start, blk.end = "00:00", "23:59"
    await db.blocks.insert_one(blk.model_dump())
    return blk


@protected.delete("/blocks/{id}", response_model=OkOut)
async def delete_block(id: str):
    res = await db.blocks.delete_one({"id": id})
    if not res.deleted_count:
        raise HTTPException(404, "Bloqueio não encontrado")
    return OkOut()


# ---- gallery ----
@protected.post("/gallery", response_model=GalleryItem)
async def add_gallery(body: GalleryIn):
    item = GalleryItem(**body.model_dump())
    await db.gallery.insert_one(item.model_dump())
    return item


@protected.put("/gallery/{id}", response_model=GalleryItem)
async def update_gallery(id: str, body: GalleryIn):
    res = await db.gallery.find_one_and_update({"id": id}, {"$set": body.model_dump()}, projection={"_id": 0}, return_document=True)
    if not res:
        raise HTTPException(404, "Foto não encontrada")
    return GalleryItem(**res)


@protected.delete("/gallery/{id}", response_model=OkOut)
async def delete_gallery(id: str):
    res = await db.gallery.delete_one({"id": id})
    if not res.deleted_count:
        raise HTTPException(404, "Foto não encontrada")
    return OkOut()


# ---- settings ----
@protected.put("/settings", response_model=SettingsModel)
async def update_settings(body: SettingsModel):
    await get_settings()
    await db.settings.update_one({"_id": "main"}, {"$set": body.model_dump()})
    return body
