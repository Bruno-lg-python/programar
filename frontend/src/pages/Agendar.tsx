import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Check, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SiteHeader from "@/components/SiteHeader";
import { apiGet, apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, FALLBACK_IMG, errMsg, fmtDateLong, fmtDuration, maskPhone, money, onlyDigits, useServices, useSettings, useToday } from "@/lib/format";
import type { Availability, Booking, BookingCreate, CheckoutResponse } from "@/lib/types";

const STEPS = ["Serviço", "Data e horário", "Seus dados", "Resumo"];

export default function Agendar() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data: services, isLoading } = useServices();
  const { data: settings } = useSettings();
  const { data: today } = useToday();

  const [serviceId, setServiceId] = useState<string>(params.get("servico") ?? "");
  const [step, setStep] = useState(params.get("servico") ? 1 : 0);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const service = services?.find((s) => s.id === serviceId);
  const dateRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (date && window.innerWidth < 768) dateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [date]);
  const pct = settings?.deposit_percent ?? 40;
  const deposit = service ? Math.round(service.price * pct) / 100 : 0;

  const avail = useQuery({
    queryKey: ["availability", serviceId, date],
    queryFn: () => apiGet<Availability>(`/availability?service_id=${serviceId}&date=${date}`),
    enabled: !!serviceId && !!date,
  });

  const closedDays = useMemo(() => (settings?.hours ?? []).filter((h) => !h.open).map((h) => (h.day + 1) % 7), [settings]);
  const minDate = today ? parseISO(today.today) : new Date();
  const maxDate = new Date(minDate.getTime() + 90 * 86400000);

  const book = useMutation({
    mutationFn: async () => {
      const body: BookingCreate = { service_id: serviceId, date, time, client_name: name.trim(), client_whatsapp: onlyDigits(phone), client_email: email.trim() || null };
      const booking = await apiPost<Booking>("/bookings", body);
      const checkout = await apiPost<CheckoutResponse>(`/bookings/${booking.id}/checkout`);
      return checkout;
    },
    onSuccess: (c) => {
      if (c.mode === "demo") navigate(c.url);
      else window.location.assign(c.url);
    },
    onError: (e) => {
      toast.error(errMsg(e));
      avail.refetch();
    },
  });

  const detailsValid = name.trim().length >= 3 && onlyDigits(phone).length >= 10 && (!email || /\S+@\S+\.\S+/.test(email));
  const go = (n: number) => setStep(n);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pt-8 pb-32 sm:px-8 md:pt-12">
        <h1 className="text-3xl sm:text-4xl" data-testid="booking-title">Agende seu horário</h1>
        <ol className="mt-6 flex gap-2" data-testid="booking-stepper">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1">
              <div className={cn("h-1.5 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-border")} />
              <p className={cn("mt-2 hidden text-xs sm:block", i === step ? "font-medium text-primary" : "text-muted-foreground")}>{i + 1}. {label}</p>
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          <motion.section key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="mt-8">
            {step === 0 && (
              <div>
                <h2 className="text-2xl">Qual serviço você deseja?</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {isLoading && <Loader2 className="size-6 animate-spin text-primary" />}
                  {services?.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      data-testid={`booking-service-option-${s.id}`}
                      onClick={() => { setServiceId(s.id); setDate(""); setTime(""); go(1); }}
                      className={cn(
                        "flex items-center gap-4 rounded-2xl border bg-card p-3 text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg",
                        serviceId === s.id && "border-primary ring-2 ring-primary/20",
                      )}
                    >
                      <img src={s.photo_url || FALLBACK_IMG} alt="" className="size-20 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-primary">{CATEGORY_LABEL[s.category]}</p>
                        <p className="truncate font-medium">{s.name}</p>
                        <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="size-3.5" />{fmtDuration(s.duration)}</span>
                          <span className="font-semibold text-foreground">{money(s.price)}</span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && service && (
              <div>
                <BackBtn onClick={() => go(0)} />
                <h2 className="text-2xl">Escolha a data e o horário</h2>
                <p className="mt-1 text-sm text-muted-foreground">{service.name} • {fmtDuration(service.duration)}</p>
                <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr]">
                  <div className="rounded-2xl border bg-card p-3" data-testid="booking-calendar">
                    <Calendar
                      mode="single"
                      locale={ptBR}
                      selected={date ? parseISO(date) : undefined}
                      onSelect={(d) => { if (d) { setDate(format(d, "yyyy-MM-dd")); setTime(""); } }}
                      disabled={[{ before: minDate }, { after: maxDate }, { dayOfWeek: closedDays }]}
                      className="[--cell-size:2.6rem]"
                    />
                  </div>
                  <div>
                    {!date && <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground" data-testid="booking-select-date-hint">Selecione uma data no calendário para ver os horários disponíveis.</p>}
                    {date && (
                      <>
                        <p ref={dateRef} className="scroll-mt-20 font-medium first-letter:uppercase" data-testid="booking-selected-date">{fmtDateLong(date)}</p>
                        {avail.isLoading && <Loader2 className="mt-4 size-6 animate-spin text-primary" />}
                        {avail.isError && <p className="mt-4 text-sm text-destructive">Não foi possível carregar os horários.</p>}
                        {avail.data && avail.data.slots.length === 0 && (
                          <p className="mt-4 rounded-2xl bg-blush p-5 text-sm" data-testid="booking-no-slots">Sem horários disponíveis nesta data. Tente outro dia 💕</p>
                        )}
                        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {avail.data?.slots.map((t) => (
                            <button
                              key={t}
                              type="button"
                              data-testid={`booking-slot-${t.replace(":", "")}`}
                              onClick={() => setTime(t)}
                              className={cn(
                                "h-11 rounded-xl border text-sm font-medium transition-colors",
                                time === t ? "border-primary bg-primary text-white" : "bg-card hover:border-primary/60",
                              )}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <StickyNext disabled={!date || !time} onClick={() => go(2)} testid="booking-next-to-details" label="Continuar" />
              </div>
            )}

            {step === 2 && (
              <div className="max-w-lg">
                <BackBtn onClick={() => go(1)} />
                <h2 className="text-2xl">Seus dados</h2>
                <div className="mt-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input id="name" data-testid="booking-name-input" className="h-12" value={name} onChange={(e) => setName(e.target.value)} placeholder="Maria da Silva" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp</Label>
                    <Input id="phone" data-testid="booking-whatsapp-input" className="h-12" inputMode="tel" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(11) 98765-4321" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail <span className="text-muted-foreground">(opcional)</span></Label>
                    <Input id="email" data-testid="booking-email-input" className="h-12" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
                  </div>
                </div>
                <StickyNext disabled={!detailsValid} onClick={() => go(3)} testid="booking-next-to-summary" label="Ver resumo" />
              </div>
            )}

            {step === 3 && service && (
              <div className="max-w-lg">
                <BackBtn onClick={() => go(2)} />
                <h2 className="text-2xl">Resumo do agendamento</h2>
                <div className="mt-6 overflow-hidden rounded-3xl border bg-card" data-testid="booking-summary">
                  <div className="space-y-3 p-6 text-sm">
                    <Row label="Serviço" value={service.name} testid="summary-service" />
                    <Row label="Data" value={fmtDateLong(date)} testid="summary-date" />
                    <Row label="Horário" value={time} testid="summary-time" />
                    <Row label="Cliente" value={name} testid="summary-name" />
                    <Row label="WhatsApp" value={phone} testid="summary-whatsapp" />
                    <Row label="Valor total" value={money(service.price)} testid="summary-total" />
                  </div>
                  <div className="flex items-center justify-between bg-blush px-6 py-5">
                    <div>
                      <p className="text-sm font-medium">Sinal para confirmar ({pct}%)</p>
                      <p className="text-xs text-muted-foreground">Restante {money(service.price - deposit)} no dia do atendimento</p>
                    </div>
                    <p className="font-heading text-3xl text-primary" data-testid="summary-deposit">{money(deposit)}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Seu horário fica reservado por 30 minutos até a confirmação do pagamento. Você receberá a confirmação pelo WhatsApp.</p>
                <StickyNext
                  disabled={book.isPending}
                  onClick={() => book.mutate()}
                  testid="booking-pay-button"
                  label={book.isPending ? "Reservando..." : `Pagar sinal de ${money(deposit)}`}
                />
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} data-testid="booking-back-button" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary">
      <ArrowLeft className="size-4" /> Voltar
    </button>
  );
}

function Row({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium" data-testid={testid}>{value}</span>
    </div>
  );
}

function StickyNext({ disabled, onClick, testid, label }: { disabled: boolean; onClick: () => void; testid: string; label: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-ivory/90 p-4 backdrop-blur-xl md:static md:mt-8 md:border-0 md:bg-transparent md:p-0">
      <Button size="lg" data-testid={testid} disabled={disabled} onClick={onClick} className="h-12 w-full rounded-full text-base md:w-auto md:px-10">
        {label} <Check className="size-4" />
      </Button>
    </div>
  );
}
