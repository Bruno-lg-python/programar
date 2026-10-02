import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarOff, Coffee, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { cn } from "@/lib/utils";
import { errMsg, fmtDateLong, useSettings, useToday } from "@/lib/format";
import type { Block, BlockIn, OkOut, SettingsModel } from "@/lib/types";

const EMPTY: BlockIn = { date: "", all_day: true, start: "12:00", end: "13:00", reason: "" };

export default function AdminBlocks() {
  const qc = useQueryClient();
  const { data: today } = useToday();
  const { data: blocks, isLoading } = useQuery({ queryKey: ["admin", "blocks"], queryFn: () => apiGet<Block[]>("/admin/blocks") });
  const [form, setForm] = useState<BlockIn>(EMPTY);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "blocks"] });
    qc.invalidateQueries({ queryKey: ["blocked-days"] });
    qc.invalidateQueries({ queryKey: ["availability"] });
  };
  const add = useMutation({
    mutationFn: () => apiPost<Block>("/admin/blocks", form),
    onSuccess: () => { refresh(); setForm({ ...EMPTY }); toast.success("Bloqueio adicionado"); },
    onError: (e) => toast.error(errMsg(e, "Verifique os campos")),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiDelete<OkOut>(`/admin/blocks/${id}`),
    onSuccess: () => { refresh(); toast.success("Bloqueio removido"); },
  });

  const valid = !!form.date && (form.all_day || form.start < form.end);

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl" data-testid="admin-blocks-title">Bloqueios de agenda</h1>
      <p className="mt-2 text-sm text-muted-foreground">Feche dias inteiros (folgas, feriados) ou faixas de horário. Clientes não verão esses horários.</p>

      <LunchCard />

      <section className="mt-6 rounded-2xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-xl"><CalendarOff className="size-5 text-primary" /> Novo bloqueio</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[180px_auto_1fr]">
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input type="date" min={today?.today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} data-testid="block-form-date" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <div className="flex gap-1 rounded-xl border p-1">
              {[true, false].map((v) => (
                <button key={String(v)} type="button" onClick={() => setForm({ ...form, all_day: v })} data-testid={`block-form-type-${v ? "dia" : "faixa"}`} className={cn("h-8 rounded-lg px-3 text-sm transition-colors", form.all_day === v ? "bg-primary text-white" : "hover:bg-secondary")}>
                  {v ? "Dia inteiro" : "Faixa de horário"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label>Motivo (opcional)</Label>
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Feriado, folga, curso..." data-testid="block-form-reason" />
          </div>
          {!form.all_day && (
            <div className="flex items-end gap-2 sm:col-span-2">
              <div className="space-y-1.5"><Label>De</Label><Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="w-32" data-testid="block-form-start" /></div>
              <div className="space-y-1.5"><Label>Até</Label><Input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="w-32" data-testid="block-form-end" /></div>
            </div>
          )}
        </div>
        <Button className="mt-4 rounded-full" disabled={!valid || add.isPending} onClick={() => add.mutate()} data-testid="block-form-submit"><Plus className="size-4" /> Bloquear</Button>
      </section>

      <section className="mt-6">
        <h2 className="text-xl">Próximos bloqueios</h2>
        <div className="mt-3 space-y-2" data-testid="admin-blocks-list">
          {isLoading && <div className="h-16 animate-pulse rounded-2xl bg-blush" />}
          {!isLoading && !blocks?.length && <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground" data-testid="admin-blocks-empty">Nenhum bloqueio cadastrado.</p>}
          {blocks?.map((b) => (
            <div key={b.id} data-testid={`admin-block-${b.id}`} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium first-letter:uppercase">{fmtDateLong(b.date)}</p>
                <p className="text-sm text-muted-foreground">{b.all_day ? "Dia inteiro" : `${b.start} – ${b.end}`}{b.reason ? ` • ${b.reason}` : ""}</p>
              </div>
              <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => del.mutate(b.id)} data-testid={`admin-block-delete-${b.id}`} aria-label="Remover"><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LunchCard() {
  const { data } = useSettings();
  if (!data) return <div className="mt-6 h-28 animate-pulse rounded-2xl bg-blush" />;
  return <LunchForm initial={data} />;
}

function LunchForm({ initial }: { initial: SettingsModel }) {
  const qc = useQueryClient();
  const [enabled, setEnabled] = useState(initial.lunch_enabled);
  const [start, setStart] = useState(initial.lunch_start);
  const [end, setEnd] = useState(initial.lunch_end);
  const save = useMutation({
    mutationFn: () => apiPut<SettingsModel>("/admin/settings", { ...initial, lunch_enabled: enabled, lunch_start: start, lunch_end: end }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
      toast.success("Horário de almoço salvo");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <section className="mt-6 rounded-2xl border bg-blush p-5" data-testid="lunch-card">
      <h2 className="flex items-center gap-2 text-xl"><Coffee className="size-5 text-primary" /> Almoço fixo (todos os dias)</h2>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="flex h-9 items-center gap-2 text-sm">
          <Checkbox checked={enabled} onCheckedChange={(c) => setEnabled(!!c)} data-testid="lunch-enabled" /> Bloquear almoço diariamente
        </label>
        <div className="space-y-1.5"><Label>De</Label><Input type="time" value={start} disabled={!enabled} onChange={(e) => setStart(e.target.value)} className="w-32 bg-white" data-testid="lunch-start" /></div>
        <div className="space-y-1.5"><Label>Até</Label><Input type="time" value={end} disabled={!enabled} onChange={(e) => setEnd(e.target.value)} className="w-32 bg-white" data-testid="lunch-end" /></div>
        <Button variant="outline" className="rounded-full bg-white" disabled={save.isPending || (enabled && start >= end)} onClick={() => save.mutate()} data-testid="lunch-save">Salvar almoço</Button>
      </div>
    </section>
  );
}
