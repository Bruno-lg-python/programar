import { useQuery } from "@tanstack/react-query";
import { apiGet, ApiError } from "@/lib/api";
import type { Category, BookingStatus, GalleryItem, SettingsModel, TodayInfo, Service } from "@/lib/types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const money = (v: number) => brl.format(v);

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const fmtDateLong = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
};

export const fmtDuration = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}` : `${min} min`);

export const CATEGORY_LABEL: Record<Category, string> = { manicure: "Manicure", pedicure: "Pedicure", outros: "Outros" };

export const STATUS_LABEL: Record<BookingStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const DAY_LABEL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export const maskPhone = (s: string) => {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const waLink = (phone: string, text = "") => {
  const d = onlyDigits(phone);
  const full = d.startsWith("55") && d.length > 11 ? d : `55${d}`;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

export const errMsg = (e: unknown, fallback = "Algo deu errado. Tente novamente.") => {
  if (e instanceof ApiError && e.body && typeof e.body === "object" && "detail" in e.body) {
    const d = (e.body as { detail: unknown }).detail;
    if (typeof d === "string") return d;
  }
  return fallback;
};

export const useSettings = () => useQuery({ queryKey: ["settings"], queryFn: () => apiGet<SettingsModel>("/settings") });
export const useToday = () => useQuery({ queryKey: ["today"], queryFn: () => apiGet<TodayInfo>("/today") });
export const useServices = () => useQuery({ queryKey: ["services"], queryFn: () => apiGet<Service[]>("/services") });
export const FALLBACK_IMG = "https://images.unsplash.com/photo-1610992015732-2449b76344bc?crop=entropy&cs=srgb&fm=jpg&q=80&w=900";
export const useGallery = () => useQuery({ queryKey: ["gallery"], queryFn: () => apiGet<GalleryItem[]>("/gallery") });
