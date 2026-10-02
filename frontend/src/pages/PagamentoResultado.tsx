import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import SiteHeader from "@/components/SiteHeader";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Booking } from "@/lib/types";

// Mercado Pago back_url: verify server-side, then show the booking.
export default function PagamentoResultado() {
  const [params] = useSearchParams();
  const paymentId = params.get("payment_id") ?? "";
  const ref = params.get("external_reference") ?? "";
  const { data, isLoading, isError } = useQuery({
    queryKey: ["payment-return", paymentId, ref],
    queryFn: () => apiGet<Booking>(`/payments/return?payment_id=${encodeURIComponent(paymentId)}&external_reference=${encodeURIComponent(ref)}`),
    enabled: !!paymentId && !!ref,
    retry: 1,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-5 py-16 text-center">
        {isLoading && <Loader2 className="mx-auto size-8 animate-spin text-primary" />}
        {(!paymentId || isError) && (
          <>
            <h1 className="text-2xl" data-testid="payment-result-title">Não conseguimos confirmar o pagamento</h1>
            <p className="mt-3 text-muted-foreground">Se o valor foi debitado, sua confirmação chegará em instantes pelo WhatsApp.</p>
          </>
        )}
        {data && (
          <>
            <h1 className="text-2xl" data-testid="payment-result-title">{data.status === "confirmado" ? "Pagamento aprovado!" : "Pagamento em análise"}</h1>
            <Link to={`/agendamento/${data.id}`} data-testid="payment-result-view-booking" className={cn(buttonVariants({ size: "lg" }), "mt-6 rounded-full")}>Ver meu agendamento</Link>
          </>
        )}
        {ref && !data && (
          <Link to={`/agendamento/${ref}`} className={cn(buttonVariants({ variant: "outline" }), "mt-6 rounded-full")}>Ver agendamento</Link>
        )}
      </main>
    </div>
  );
}
