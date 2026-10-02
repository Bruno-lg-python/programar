import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, QrCode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/SiteHeader";
import { apiGet, apiPost } from "@/lib/api";
import { errMsg, fmtDateLong, money } from "@/lib/format";
import type { Booking } from "@/lib/types";

// MOCK checkout: used while no Mercado Pago access token is configured.
export default function PagamentoDemo() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: b, isLoading, isError } = useQuery({ queryKey: ["booking", id], queryFn: () => apiGet<Booking>(`/bookings/${id}`) });
  const pix = `00020126580014BR.GOV.BCB.PIX0136demo-${id.slice(0, 8)}5204000053039865406${b?.deposit_amount.toFixed(2) ?? "0.00"}5802BR`;

  const pay = useMutation({
    mutationFn: () => apiPost<Booking>(`/bookings/${id}/demo-pay`),
    onSuccess: (booking) => {
      qc.setQueryData(["booking", id], booking);
      navigate(`/agendamento/${id}?pago=1`);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-5 py-10">
        <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#009EE3]">Mercado Pago</p>
            <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-medium text-[#78350F]" data-testid="payment-demo-badge">Modo demonstração</span>
          </div>
          {isLoading && <Loader2 className="mt-6 size-6 animate-spin text-primary" />}
          {isError && <p className="mt-6 text-sm text-destructive">Agendamento não encontrado.</p>}
          {b && (
            <>
              <h1 className="mt-4 text-2xl">Pagamento do sinal</h1>
              <p className="mt-1 text-sm text-muted-foreground">{b.service_name} • <span className="inline-block first-letter:uppercase">{fmtDateLong(b.date)}</span> às {b.time}</p>
              <p className="mt-6 font-heading text-4xl text-primary" data-testid="payment-amount">{money(b.deposit_amount)}</p>
              <div className="mt-6 grid place-items-center rounded-2xl bg-blush p-6">
                <QrCode className="size-32 text-ink" strokeWidth={1} />
                <p className="mt-2 text-xs text-muted-foreground">Pix (simulado)</p>
              </div>
              <button
                type="button"
                data-testid="payment-copy-pix"
                onClick={() => { navigator.clipboard?.writeText(pix); toast.success("Código Pix copiado"); }}
                className="mt-4 flex w-full items-center gap-2 rounded-xl border p-3 text-left font-mono text-xs transition-colors hover:border-primary"
              >
                <span className="truncate">{pix}</span>
                <Copy className="size-4 shrink-0" />
              </button>
              {b.status === "aguardando_pagamento" ? (
                <Button size="lg" data-testid="payment-simulate-approve" disabled={pay.isPending} onClick={() => pay.mutate()} className="mt-6 h-12 w-full rounded-full text-base">
                  {pay.isPending ? "Processando..." : "Simular pagamento aprovado"}
                </Button>
              ) : (
                <Button size="lg" variant="outline" onClick={() => navigate(`/agendamento/${id}`)} className="mt-6 h-12 w-full rounded-full" data-testid="payment-view-booking">Ver agendamento</Button>
              )}
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" /> Configure o token do Mercado Pago para cobranças reais.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
