import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet, apiPatch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { fmtDate, fmtDateLong, maskPhone, money, STATUS_LABEL, useToday, waLink } from "@/lib/format";
import type { Booking, BookingStatus } from "@/lib/types";

const STATUS_STYLE: Record<BookingStatus, string> = {
  aguardando_pagamento: "bg-[#FEF3C7] text-[#78350F]",
  confirmado: "bg-[#DCF8C6] text-[#064E3B]",
  concluido: "bg-secondary text-foreground",
  cancelado: "bg-red-100 text-red-800",
};

type View = "proximos" | "dia" | "todos";

export default function AdminBookings() {
  const qc = useQueryClient();
  const { data: today } = useToday();
  const [view, setView] = useState<View>("proximos");
  const [day, setDay] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin", "bookings"], queryFn: () => apiGet<Booking[]>("/admin/bookings") });

  const t = today?.today ?? "";
  const selectedDay = day || t;
  const list = useMemo(() => {
    const all = data ?? [];
    if (view === "dia") return all.filter((b) => b.date === selectedDay);
    if (view === "proximos") return all.filter((b) => b.date >= t && b.status !== "cancelado");
    return [...all].reverse();
  }, [data, view, selectedDay, t]);

  const todays = (data ?? []).filter((b) => b.date === t && b.status === "confirmado");
  const upcoming = (data ?? []).filter((b) => b.date >= t && b.status === "confirmado");
  const revenue = upcoming.reduce((s, b) => s + b.deposit_amount, 0);

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => apiPatch<Booking>(`/admin/bookings/${id}`, { status }),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
      toast.success(`Agendamento ${STATUS_LABEL[b.status].toLowerCase()}`);
    },
  });

  return (
    <div>
      <h1 className="text-3xl" data-testid="admin-bookings-title">Agenda</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Atendimentos hoje" value={String(todays.length)} testid="stat-today" />
        <Stat label="Próximos confirmados" value={String(upcoming.length)} testid="stat-upcoming" />
        <Stat label="Sinais recebidos (próximos)" value={money(revenue)} testid="stat-revenue" accent />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(["proximos", "dia", "todos"] as View[]).map((v) => (
          <button key={v} type="button" data-testid={`bookings-view-${v}`} onClick={() => setView(v)} className={cn("h-9 rounded-full border px-4 text-sm transition-colors", view === v ? "border-primary bg-primary text-white" : "bg-card hover:border-primary/50")}>
            {v === "proximos" ? "Próximos" : v === "dia" ? "Por dia" : "Histórico"}
          </button>
        ))}
        {view === "dia" && <Input type="date" value={selectedDay} onChange={(e) => setDay(e.target.value)} className="h-9 w-44" data-testid="bookings-day-input" />}
      </div>

      <div className="mt-5 space-y-3" data-testid="admin-bookings-list">
        {isLoading && <div className="h-24 animate-pulse rounded-2xl bg-blush" />}
        {!isLoading && list.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground" data-testid="admin-bookings-empty">Nenhum agendamento por aqui.</p>}
        {list.map((b) => (
          <div key={b.id} data-testid={`admin-booking-${b.id}`} className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
            <div className="w-24 shrink-0">
              <p className="font-heading text-2xl">{b.time}</p>
              <p className="text-xs text-muted-foreground">{b.date === t ? "Hoje" : fmtDate(b.date)}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium" data-testid={`admin-booking-client-${b.id}`}>{b.client_name}</p>
                <Badge className={cn("rounded-full border-0", STATUS_STYLE[b.status])} data-testid={`admin-booking-status-${b.id}`}>{STATUS_LABEL[b.status]}</Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{b.service_name} • até {b.end_time} • <span className="inline-block first-letter:uppercase">{fmtDateLong(b.date)}</span></p>
              <p className="mt-0.5 text-xs text-muted-foreground">{maskPhone(b.client_whatsapp)}{b.client_email ? ` • ${b.client_email}` : ""} • Sinal {money(b.deposit_amount)} / Total {money(b.service_price)} • {b.code}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <a href={waLink(b.client_whatsapp)} target="_blank" rel="noreferrer" data-testid={`admin-booking-whatsapp-${b.id}`} className="grid size-9 place-items-center rounded-full border text-[#15803D] transition-colors hover:bg-[#DCF8C6]" aria-label="WhatsApp">
                <MessageCircle className="size-4" />
              </a>
              {b.status === "confirmado" && (
                <Button size="sm" variant="outline" className="rounded-full" data-testid={`admin-booking-complete-${b.id}`} onClick={() => update.mutate({ id: b.id, status: "concluido" })}>
                  <CheckCircle2 className="size-4" /> Concluir
                </Button>
              )}
              {(b.status === "confirmado" || b.status === "aguardando_pagamento") && (
                <Button size="sm" variant="ghost" className="rounded-full text-destructive" data-testid={`admin-booking-cancel-${b.id}`} onClick={() => { if (confirm("Cancelar este agendamento? O horário será liberado.")) update.mutate({ id: b.id, status: "cancelado" }); }}>
                  <XCircle className="size-4" /> Cancelar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, testid, accent }: { label: string; value: string; testid: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-5", accent ? "border-primary bg-primary text-white" : "bg-card")}>
      <p className={cn("text-sm", accent ? "text-white/80" : "text-muted-foreground")}>{label}</p>
      <p className="mt-2 font-heading text-3xl" data-testid={testid}>{value}</p>
    </div>
  );
}
