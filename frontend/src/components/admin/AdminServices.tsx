import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, errMsg, fmtDuration, money } from "@/lib/format";
import type { Category, OkOut, Service, ServiceIn } from "@/lib/types";

const EMPTY: ServiceIn = { name: "", description: "", price: 0, duration: 60, photo_url: "", category: "manicure", active: true };

export default function AdminServices() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "services"], queryFn: () => apiGet<Service[]>("/admin/services") });
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceIn>(EMPTY);
  const [open, setOpen] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "services"] });
    qc.invalidateQueries({ queryKey: ["services"] });
  };

  const save = useMutation({
    mutationFn: () => (editing ? apiPut<Service>(`/admin/services/${editing.id}`, form) : apiPost<Service>("/admin/services", form)),
    onSuccess: () => { refresh(); setOpen(false); toast.success(editing ? "Serviço atualizado" : "Serviço criado"); },
    onError: (e) => toast.error(errMsg(e, "Verifique os campos")),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiDelete<OkOut>(`/admin/services/${id}`),
    onSuccess: () => { refresh(); toast.success("Serviço excluído"); },
  });
  const toggle = useMutation({
    mutationFn: (s: Service) => apiPut<Service>(`/admin/services/${s.id}`, { ...s, active: !s.active }),
    onSuccess: refresh,
  });

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (s: Service) => { setEditing(s); const { id: _id, ...rest } = s; setForm(rest); setOpen(true); };
  const set = <K extends keyof ServiceIn>(k: K, v: ServiceIn[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim().length >= 2 && form.price > 0 && form.duration > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl" data-testid="admin-services-title">Serviços</h1>
        <Button onClick={openNew} className="rounded-full" data-testid="admin-service-add-button"><Plus className="size-4" /> Novo serviço</Button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && <div className="h-40 animate-pulse rounded-2xl bg-blush" />}
        {data?.map((s) => (
          <div key={s.id} data-testid={`admin-service-${s.id}`} className={cn("flex gap-4 rounded-2xl border bg-card p-4 transition-opacity", !s.active && "opacity-60")}>
            {s.photo_url ? <img src={s.photo_url} alt="" className="size-20 shrink-0 rounded-xl object-cover" /> : <div className="size-20 shrink-0 rounded-xl bg-blush" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">{CATEGORY_LABEL[s.category]}</Badge>
                {!s.active && <Badge variant="outline" className="rounded-full">Inativo</Badge>}
              </div>
              <p className="mt-1.5 truncate font-medium" data-testid={`admin-service-name-${s.id}`}>{s.name}</p>
              <p className="text-sm text-muted-foreground">{money(s.price)} • {fmtDuration(s.duration)}</p>
              <div className="mt-2 flex items-center gap-1">
                <Button size="xs" variant="ghost" onClick={() => toggle.mutate(s)} data-testid={`admin-service-toggle-${s.id}`}>{s.active ? "Desativar" : "Ativar"}</Button>
                <Button size="icon-xs" variant="ghost" onClick={() => openEdit(s)} data-testid={`admin-service-edit-${s.id}`} aria-label="Editar"><Pencil className="size-3.5" /></Button>
                <Button size="icon-xs" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Excluir "${s.name}"?`)) del.mutate(s.id); }} data-testid={`admin-service-delete-${s.id}`} aria-label="Excluir"><Trash2 className="size-3.5" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" data-testid="admin-service-dialog">
          <DialogHeader><DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Nome</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="service-form-name" /></div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} data-testid="service-form-description" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Preço (R$)</Label><Input type="number" min={0} step="0.01" value={form.price || ""} onChange={(e) => set("price", Number(e.target.value))} data-testid="service-form-price" /></div>
              <div className="space-y-1.5"><Label>Duração (min)</Label><Input type="number" min={5} step={5} value={form.duration || ""} onChange={(e) => set("duration", Number(e.target.value))} data-testid="service-form-duration" /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v: string) => set("category", v as Category)}>
                <SelectTrigger className="w-full" data-testid="service-form-category"><SelectValue>{(v) => CATEGORY_LABEL[v as Category]}</SelectValue></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => <SelectItem key={c} value={c} data-testid={`service-form-category-${c}`}>{CATEGORY_LABEL[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>URL da foto</Label><Input value={form.photo_url} onChange={(e) => set("photo_url", e.target.value)} placeholder="https://..." data-testid="service-form-photo" /></div>
            {form.photo_url && <img src={form.photo_url} alt="" className="h-32 w-full rounded-xl object-cover" />}
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.active} onCheckedChange={(c) => set("active", !!c)} data-testid="service-form-active" /> Serviço ativo (visível para clientes)</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} data-testid="service-form-cancel">Cancelar</Button>
            <Button disabled={!valid || save.isPending} onClick={() => save.mutate()} data-testid="service-form-save">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
