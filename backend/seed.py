"""Idempotent seed: default settings + sample services (only if collection empty)."""

import asyncio

from lib.booking_logic import get_settings
from lib.db import db, ensure_indexes
from models.schemas import GalleryItem, Service

U = "https://images.unsplash.com/"
Q = "?crop=entropy&cs=srgb&fm=jpg&q=80&w=900"
SERVICES = [
    ("Manicure tradicional", "Cutilagem caprichada, lixamento e hidratação das mãos.", 35, 40, U + "photo-1610992015732-2449b76344bc" + Q, "manicure"),
    ("Esmaltação", "Esmaltação comum com acabamento perfeito e top coat.", 25, 30, U + "photo-1519014816548-bf5fe059798b" + Q, "manicure"),
    ("Manicure + esmaltação", "Cutilagem completa com esmaltação na cor que você escolher.", 50, 60, U + "photo-1690749138086-7422f71dc159" + Q, "manicure"),
    ("Esmaltação em gel", "Brilho intenso e durabilidade de até 3 semanas.", 90, 90, U + "photo-1632345031435-8727f6897d53" + Q, "manicure"),
    ("Pedicure tradicional", "Cutilagem, lixamento e hidratação dos pés.", 40, 45, U + "photo-1519419451778-14599a49ec41" + Q, "pedicure"),
    ("Pedicure + esmaltação", "Pedicure completa com esmaltação e finalização.", 60, 60, U + "photo-1519415510236-718bdfcd89c8" + Q, "pedicure"),
    ("Spa dos pés", "Escalda-pés, esfoliação, máscara hidratante e massagem relaxante.", 80, 60, U + "photo-1519415510236-718bdfcd89c8" + Q, "outros"),
]

GALLERY = [
    ("photo-1604654894610-df63bc536371", "Esmaltação em gel nude"),
    ("photo-1519014816548-bf5fe059798b", "Nail art delicada"),
    ("photo-1632345031435-8727f6897d53", "Cutilagem russa"),
    ("photo-1610992015732-2449b76344bc", "Francesinha clássica"),
    ("photo-1690749138086-7422f71dc159", "Gel moldado"),
    ("photo-1519415510236-718bdfcd89c8", "Spa dos pés"),
]


async def main() -> None:
    await ensure_indexes()
    await get_settings()
    if await db.services.count_documents({}) == 0:
        for name, desc, price, dur, photo, cat in SERVICES:
            await db.services.insert_one(Service(name=name, description=desc, price=price, duration=dur, photo_url=photo, category=cat).model_dump())
        print("services seeded")
    if await db.gallery.count_documents({}) == 0:
        for photo, caption in GALLERY:
            await db.gallery.insert_one(GalleryItem(image_url=U + photo + Q, caption=caption).model_dump())
        print("gallery seeded")
    print("ok")


if __name__ == "__main__":
    asyncio.run(main())
