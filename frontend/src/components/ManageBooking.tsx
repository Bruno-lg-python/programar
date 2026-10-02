import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DateSlotPicker from "@/components/DateSlotPicker";
import { apiGet, apiPost } from "@/lib/api";
import { errMsg, fmtDateLong, money } from "@/lib/format";
import type { Booking, BookingPolicy, RescheduleIn } from "@/lib/types";

// Client self-service: reschedule or cancel (deposit becomes credit) up to N hours before.
export default function ManageBooking({ booking }: { booking: Booking }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"none" | "remarcar" | "cancelar">("none");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const policy = useQuery({ queryKey: ["booking-policy", booking.id, booking.date, booking.time, booking.status], queryFn: () => apiGet<BookingPolicy>(`/bookings/${booking.id}/policy`) });

  const done = (b: Booking, msg: string) => {
    qc.setQueryData(["booking", b.id], b);
    qc.invalidateQueries({ queryKey: ["availability"] });
    setMode("none");
    toast.success(msg);
  };
  const reschedule = useMutation({
    mutationFn: () => apiPost<Booking>(`/bookings/${booking.id}/reschedule`, { date, time } satisfies RescheduleIn),
    onSuccess: (b) => done(b, "Horário remarcado! Você receberá a confirmação pelo WhatsApp."),
    onError: (e) => { toast.error(errMsg(e)); qc.invalidateQueries({ queryKey: ["availability"] }); },
  });
  const cancel = useMutation({
    mutationFn: () => apiPost<Booking>(`/bookings/${booking.id}/cancel`),
    onSuccess: (b) => done(b, "Agendamento cancelado. Seu sinal virou crédito."),
    onError: (e) => toast.error(errMsg(e)),
  });

  if (booking.status !== "confirmado" || !policy.data) return null;
  const p = policy.data;
  const credit = booking.deposit_amount + booking.credit_applied;
  const deadline = new Date(p.deadline).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  if (!p.can_change) {
    return (
      <p className="mt-5 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground" data-testid="manage-booking-locked">
        Remarcações e cancelamentos online são permitidos até {p.hours}h antes do horário. Para alterações, fale com a profissional pelo WhatsApp.
      </p>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border bg-card p-5" data-testid="manage-booking">
      <p className="font-medium">Precisa mudar algo?</p>
      <p className="mt-1 text-sm text-muted-foreground">Você pode remarcar ou cancelar até <strong className="text-foreground">{deadline}</strong>. Ao cancelar, o sinal de {money(credit)} vira crédito para o próximo agendamento.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="h-11 flex-1 rounded-full" onClick={() => { setDate(""); setTime(""); setMode("remarcar"); }} data-testid="manage-reschedule-button">
          <CalendarClock className="size-4" /> Remarcar
        </Button>
        <Button variant="ghost" className="h-11 flex-1 rounded-full text-destructive" onClick={() => setMode("cancelar")} data-testid="manage-cancel-button">
          <XCircle className="size-4" /> Cancelar horário
        </Button>
      </div>

      <Dialog open={mode === "remarcar"} onOpenChange={(o) => !o && setMode("none")}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl" data-testid="reschedule-dialog">
          <DialogHeader>
            <DialogTitle>Remarcar {booking.service_name}</DialogTitle>
            <DialogDescription>Atual: <span className="first-letter:uppercase">{fmtDateLong(booking.date)}</span> às {booking.time}. Escolha a nova data e horário.</DialogDescription>
          </DialogHeader>
          <DateSlotPicker serviceId={booking.service_id} date={date} time={time} onDate={setDate} onTime={setTime} excludeBookingId={booking.id} testPrefix="reschedule" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode("none")} data-testid="reschedule-cancel">Voltar</Button>
            <Button disabled={!date || !time || reschedule.isPending} onClick={() => reschedule.mutate()} data-testid="reschedule-confirm">
              {reschedule.isPending ? "Remarcando..." : time ? `Confirmar ${time}` : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mode === "cancelar"} onOpenChange={(o) => !o && setMode("none")}>
        <DialogContent data-testid="cancel-dialog">
          <DialogHeader>
            <DialogTitle>Cancelar agendamento?</DialogTitle>
            <DialogDescription>
              O horário será liberado e o sinal de <strong>{money(credit)}</strong> ficará como crédito para o seu próximo agendamento usando este mesmo WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode("none")} data-testid="cancel-dialog-back">Manter horário</Button>
            <Button variant="destructive" disabled={cancel.isPending} onClick={() => cancel.mutate()} data-testid="cancel-dialog-confirm">Sim, cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
