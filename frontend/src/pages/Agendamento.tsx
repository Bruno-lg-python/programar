import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CalendarCheck, Hourglass, Loader2, MapPin, MessageCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { apiGet, apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";
import { errMsg, fmtDateLong, money, STATUS_LABEL, useSettings, waLink } from "@/lib/format";
import type { Booking, CheckoutResponse } from "@/lib/types";

export default function Agendamento() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const { data: s } = useSettings();
  const { data: b, isLoading, isError } = useQuery({ queryKey: ["booking", id], queryFn: () => apiGet<Booking>(`/bookings/${id}`) });

  const pay = useMutation({
    mutationFn: () => apiPost<CheckoutResponse>(`/bookings/${id}/checkout`),
    onSuccess: (c) => window.location.assign(c.url),
    onError: (e) => toast.error(errMsg(e)),
  });

  const confirmed = b?.status === "confirmado" || b?.status === "concluido";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-12">
        {isLoading && <Loader2 className="mx-auto size-8 animate-spin text-primary" />}
        {isError && <p className="text-center text-muted-foreground" data-testid="booking-not-found">Agendamento não encontrado.</p>}
        {b && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center">
              <div className={cn("mx-auto grid size-16 place-items-center rounded-full", confirmed ? "bg-[#DCF8C6] text-[#15803D]" : b.status === "cancelado" ? "bg-red-100 text-destructive" : "bg-[#FEF3C7] text-[#92400E]")}>
                {confirmed ? <CalendarCheck className="size-8" /> : b.status === "cancelado" ? <XCircle className="size-8" /> : <Hourglass className="size-8" />}
              </div>
              <h1 className="mt-5 text-3xl" data-testid="booking-status-title">
                {confirmed ? (params.get("pago") ? "Horário confirmado! 💅" : "Horário confirmado") : b.status === "cancelado" ? "Agendamento cancelado" : "Aguardando pagamento"}
              </h1>
              <p className="mt-2 text-muted-foreground" data-testid="booking-status-label">{STATUS_LABEL[b.status]} • Código <span className="font-mono font-medium text-foreground" data-testid="booking-code">{b.code}</span></p>
            </div>
            <div className="mt-8 rounded-3xl border bg-card p-6 text-sm">
              <dl className="space-y-3">
                <div className="flex justify-between"><dt className="text-muted-foreground">Serviço</dt><dd className="font-medium" data-testid="booking-detail-service">{b.service_name}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Data</dt><dd className="font-medium first-letter:uppercase" data-testid="booking-detail-date">{fmtDateLong(b.date)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Horário</dt><dd className="font-medium" data-testid="booking-detail-time">{b.time} – {b.end_time}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Sinal {confirmed ? "pago" : ""}</dt><dd className="font-medium" data-testid="booking-detail-deposit">{money(b.deposit_amount)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Restante no dia</dt><dd className="font-medium">{money(b.remaining_amount)}</dd></div>
              </dl>
              {s && (
                <p className="mt-5 flex items-start gap-2 border-t pt-4 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" />{s.address} — {s.city}</p>
              )}
            </div>
            {confirmed && (
              <p className="mt-5 rounded-2xl bg-[#DCF8C6] p-4 text-sm text-[#064E3B]" data-testid="booking-whatsapp-note">
                Você receberá a confirmação pelo WhatsApp, um lembrete no dia e outro 15 minutos antes do horário.
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {b.status === "aguardando_pagamento" && (
                <Button size="lg" className="h-12 flex-1 rounded-full" disabled={pay.isPending} onClick={() => pay.mutate()} data-testid="booking-retry-pay-button">
                  Pagar sinal de {money(b.deposit_amount)}
                </Button>
              )}
              {s && (
                <a href={waLink(s.whatsapp, `Olá! Tenho um agendamento (${b.code}) para ${b.service_name}.`)} target="_blank" rel="noreferrer" data-testid="booking-whatsapp-button" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 flex-1 rounded-full")}>
                  <MessageCircle className="size-4" /> Falar com a profissional
                </a>
              )}
              <Link to="/" data-testid="booking-home-link" className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "h-12 rounded-full")}>Voltar ao início</Link>
            </div>
          </motion.div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
