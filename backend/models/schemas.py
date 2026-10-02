import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field

Category = Literal["manicure", "pedicure", "outros"]
BookingStatus = Literal["aguardando_pagamento", "confirmado", "concluido", "cancelado"]
MessageKind = Literal["confirmacao", "lembrete_dia", "lembrete_15min"]


def _id() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ServiceIn(BaseModel):
    name: str = Field(min_length=2)
    description: str = ""
    price: float = Field(gt=0)
    duration: int = Field(gt=0, description="minutos")
    photo_url: str = ""
    category: Category = "manicure"
    active: bool = True


class Service(ServiceIn):
    id: str = Field(default_factory=_id)


class DayHours(BaseModel):
    day: int  # 0 = segunda ... 6 = domingo
    open: bool
    start: str = "09:00"
    end: str = "19:00"


class SettingsModel(BaseModel):
    business_name: str
    professional_name: str
    tagline: str
    bio: str
    whatsapp: str
    instagram: str
    address: str
    city: str
    photo_url: str
    service_info: str
    slot_interval: int = 30
    deposit_percent: int = 40
    hours: list[DayHours]


class Slot(BaseModel):
    time: str


class Availability(BaseModel):
    date: str
    open: bool
    slots: list[str]


class TodayInfo(BaseModel):
    today: str
    payment_mode: Literal["mercadopago", "demo"]


class BookingCreate(BaseModel):
    service_id: str
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str = Field(pattern=r"^\d{2}:\d{2}$")
    client_name: str = Field(min_length=3)
    client_whatsapp: str = Field(min_length=10)
    client_email: Optional[str] = None


class Booking(BaseModel):
    id: str = Field(default_factory=_id)
    code: str
    service_id: str
    service_name: str
    service_price: float
    service_duration: int
    date: str
    time: str
    end_time: str
    client_name: str
    client_whatsapp: str
    client_email: Optional[str] = None
    deposit_amount: float
    remaining_amount: float
    status: BookingStatus = "aguardando_pagamento"
    payment_id: Optional[str] = None
    payment_method: Optional[str] = None
    hold_expires_at: datetime
    created_at: datetime = Field(default_factory=_now)


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


class CheckoutResponse(BaseModel):
    mode: Literal["mercadopago", "demo"]
    url: str


class Message(BaseModel):
    id: str = Field(default_factory=_id)
    booking_id: str
    kind: MessageKind
    phone: str
    client_name: str
    text: str
    status: Literal["pendente", "enviada"] = "pendente"
    created_at: datetime = Field(default_factory=_now)


class LoginIn(BaseModel):
    password: str


class OkOut(BaseModel):
    ok: bool = True
