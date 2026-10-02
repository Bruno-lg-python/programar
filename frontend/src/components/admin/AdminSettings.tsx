import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiPut } from "@/lib/api";
import { DAY_LABEL, errMsg, useSettings } from "@/lib/format";
import type { DayHours, SettingsModel } from "@/lib/types";

export default function AdminSettings() {
  const { data } = useSettings();
  if (!data) return <div className="h-40 animate-pulse rounded-2xl bg-blush" />;
  return <SettingsForm initial={data} />;
}

const TEXT_FIELDS: { key: keyof SettingsModel; label: string; long?: boolean }[] = [
  { key: "business_name", label: "Nome do estúdio" },
  { key: "professional_name", label: "Nome da profissional" },
  { key: "tagline", label: "Frase de apresentação" },
  { key: "whatsapp", label: "WhatsApp (com DDD)" },
  { key: "instagram", label: "Instagram (sem @)" },
  { key: "address", label: "Endereço" },
  { key: "city", label: "Bairro / Cidade" },
  { key: "photo_url", label: "URL da foto profissional" },
  { key: "bio", label: "Sobre você", long: true },
  { key: "service_info", label: "Informações sobre o atendimento", long: true },
];

function SettingsForm({ initial }: { initial: SettingsModel }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<SettingsModel>(initial);
  const save = useMutation({
    mutationFn: () => apiPut<SettingsModel>("/admin/settings", form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Configurações salvas"); },
    onError: (e) => toast.error(errMsg(e, "Verifique os campos")),
  });
  const setHour = (day: number, patch: Partial<DayHours>) => setForm((f) => ({ ...f, hours: f.hours.map((h) => (h.day === day ? { ...h, ...patch } : h)) }));

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl" data-testid="admin-settings-title">Configurações</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border bg-card p-5">
          <h2 className="text-xl">Perfil e contato</h2>
          {TEXT_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              {f.long ? (
                <Textarea value={String(form[f.key])} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} data-testid={`settings-${f.key}`} />
              ) : (
                <Input value={String(form[f.key])} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} data-testid={`settings-${f.key}`} />
              )}
            </div>
          ))}
        </section>
        <section className="h-fit space-y-4 rounded-2xl border bg-card p-5">
          <h2 className="text-xl">Horário de funcionamento</h2>
          {form.hours.map((h) => (
            <div key={h.day} className="flex items-center gap-3" data-testid={`settings-hours-${h.day}`}>
              <label className="flex w-28 items-center gap-2 text-sm">
                <Checkbox checked={h.open} onCheckedChange={(c) => setHour(h.day, { open: !!c })} data-testid={`settings-hours-open-${h.day}`} /> {DAY_LABEL[h.day]}
              </label>
              <Input type="time" value={h.start} disabled={!h.open} onChange={(e) => setHour(h.day, { start: e.target.value })} className="w-28" data-testid={`settings-hours-start-${h.day}`} />
              <span className="text-muted-foreground">–</span>
              <Input type="time" value={h.end} disabled={!h.open} onChange={(e) => setHour(h.day, { end: e.target.value })} className="w-28" data-testid={`settings-hours-end-${h.day}`} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3 border-t pt-4">
            <div className="space-y-1.5"><Label>Intervalo entre horários (min)</Label><Input type="number" min={10} step={5} value={form.slot_interval} onChange={(e) => setForm({ ...form, slot_interval: Number(e.target.value) })} data-testid="settings-slot-interval" /></div>
            <div className="space-y-1.5"><Label>Sinal (%)</Label><Input type="number" min={1} max={100} value={form.deposit_percent} onChange={(e) => setForm({ ...form, deposit_percent: Number(e.target.value) })} data-testid="settings-deposit-percent" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Cliente pode remarcar/cancelar até (horas antes)</Label><Input type="number" min={0} max={168} value={form.reschedule_hours} onChange={(e) => setForm({ ...form, reschedule_hours: Number(e.target.value) })} data-testid="settings-reschedule-hours" /></div>
          </div>
        </section>
      </div>
      <Button size="lg" className="mt-6 rounded-full px-8" disabled={save.isPending} onClick={() => save.mutate()} data-testid="settings-save-button">Salvar configurações</Button>
    </div>
  );
}
