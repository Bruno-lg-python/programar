import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";
import { fmtDateLong, useSettings, useToday } from "@/lib/format";
import type { Availability } from "@/lib/types";

interface Props {
  serviceId: string;
  date: string;
  time: string;
  onDate: (d: string) => void;
  onTime: (t: string) => void;
  excludeBookingId?: string;
  testPrefix?: string;
}

export const useBlockedDays = () => useQuery({ queryKey: ["blocked-days"], queryFn: () => apiGet<string[]>("/blocked-days") });

// Calendar + available slot pills, shared by the booking wizard and the reschedule dialog.
export default function DateSlotPicker({ serviceId, date, time, onDate, onTime, excludeBookingId, testPrefix = "booking" }: Props) {
  const { data: settings } = useSettings();
  const { data: today } = useToday();
  const { data: blocked } = useBlockedDays();
  const dateRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (date && window.innerWidth < 768) dateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [date]);

  const avail = useQuery({
    queryKey: ["availability", serviceId, date, excludeBookingId ?? ""],
    queryFn: () => apiGet<Availability>(`/availability?service_id=${serviceId}&date=${date}${excludeBookingId ? `&exclude=${excludeBookingId}` : ""}`),
    enabled: !!serviceId && !!date,
  });

  const closedDays = useMemo(() => (settings?.hours ?? []).filter((h) => !h.open).map((h) => (h.day + 1) % 7), [settings]);
  const blockedDates = useMemo(() => (blocked ?? []).map((d) => parseISO(d)), [blocked]);
  const minDate = today ? parseISO(today.today) : new Date();
  const maxDate = new Date(minDate.getTime() + 90 * 86400000);

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <div className="w-fit rounded-2xl border bg-card p-3" data-testid={`${testPrefix}-calendar`}>
        <Calendar
          mode="single"
          locale={ptBR}
          selected={date ? parseISO(date) : undefined}
          onSelect={(d) => { if (d) { onDate(format(d, "yyyy-MM-dd")); onTime(""); } }}
          disabled={[{ before: minDate }, { after: maxDate }, { dayOfWeek: closedDays }, ...blockedDates]}
          className="[--cell-size:2.6rem]"
        />
      </div>
      <div>
        {!date && <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground" data-testid={`${testPrefix}-select-date-hint`}>Selecione uma data no calendário para ver os horários disponíveis.</p>}
        {date && (
          <>
            <p ref={dateRef} className="scroll-mt-20 font-medium first-letter:uppercase" data-testid={`${testPrefix}-selected-date`}>{fmtDateLong(date)}</p>
            {avail.isLoading && <Loader2 className="mt-4 size-6 animate-spin text-primary" />}
            {avail.isError && <p className="mt-4 text-sm text-destructive">Não foi possível carregar os horários.</p>}
            {avail.data && avail.data.slots.length === 0 && (
              <p className="mt-4 rounded-2xl bg-blush p-5 text-sm" data-testid={`${testPrefix}-no-slots`}>Sem horários disponíveis nesta data. Tente outro dia 💕</p>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {avail.data?.slots.map((t) => (
                <button
                  key={t}
                  type="button"
                  data-testid={`${testPrefix}-slot-${t.replace(":", "")}`}
                  onClick={() => onTime(t)}
                  className={cn("h-11 rounded-xl border text-sm font-medium transition-colors", time === t ? "border-primary bg-primary text-white" : "bg-card hover:border-primary/60")}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
