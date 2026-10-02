// Hand-written mirrors of backend/models/schemas.py — keep in sync.
export type Category = "manicure" | "pedicure" | "outros";
export type BookingStatus = "aguardando_pagamento" | "confirmado" | "concluido" | "cancelado";
export type MessageKind = "confirmacao" | "lembrete_dia" | "lembrete_15min";

export interface ServiceIn {
  name: string;
  description: string;
  price: number;
  duration: number;
  photo_url: string;
  category: Category;
  active: boolean;
}

export interface Service extends ServiceIn {
  id: string;
}

export interface DayHours {
  day: number;
  open: boolean;
  start: string;
  end: string;
}

export interface SettingsModel {
  business_name: string;
  professional_name: string;
  tagline: string;
  bio: string;
  whatsapp: string;
  instagram: string;
  address: string;
  city: string;
  photo_url: string;
  service_info: string;
  slot_interval: number;
  deposit_percent: number;
  hours: DayHours[];
}

export interface Availability {
  date: string;
  open: boolean;
  slots: string[];
}

export interface TodayInfo {
  today: string;
  payment_mode: "mercadopago" | "demo";
}

export interface BookingCreate {
  service_id: string;
  date: string;
  time: string;
  client_name: string;
  client_whatsapp: string;
  client_email?: string | null;
}

export interface Booking {
  id: string;
  code: string;
  service_id: string;
  service_name: string;
  service_price: number;
  service_duration: number;
  date: string;
  time: string;
  end_time: string;
  client_name: string;
  client_whatsapp: string;
  client_email: string | null;
  deposit_amount: number;
  remaining_amount: number;
  status: BookingStatus;
  payment_id: string | null;
  payment_method: string | null;
  hold_expires_at: string;
  created_at: string;
}

export interface CheckoutResponse {
  mode: "mercadopago" | "demo";
  url: string;
}

export interface Message {
  id: string;
  booking_id: string;
  kind: MessageKind;
  phone: string;
  client_name: string;
  text: string;
  status: "pendente" | "enviada";
  created_at: string;
}

export interface OkOut {
  ok: boolean;
}
