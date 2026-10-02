import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiDelete, apiPost } from "@/lib/api";
import { errMsg, useGallery } from "@/lib/format";
import type { GalleryIn, GalleryItem, OkOut } from "@/lib/types";

export default function AdminGallery() {
  const qc = useQueryClient();
  const { data, isLoading } = useGallery();
  const [form, setForm] = useState<GalleryIn>({ image_url: "", caption: "" });
  const add = useMutation({
    mutationFn: () => apiPost<GalleryItem>("/admin/gallery", form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gallery"] }); setForm({ image_url: "", caption: "" }); toast.success("Foto adicionada"); },
    onError: (e) => toast.error(errMsg(e, "Informe uma URL válida")),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiDelete<OkOut>(`/admin/gallery/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gallery"] }); toast.success("Foto removida"); },
  });
  const valid = /^https?:\/\/.{5,}/.test(form.image_url);

  return (
    <div>
      <h1 className="text-3xl" data-testid="admin-gallery-title">Galeria de trabalhos</h1>
      <p className="mt-2 text-sm text-muted-foreground">As fotos aparecem na página inicial, na seção "Trabalhos".</p>
      <section className="mt-6 grid gap-4 rounded-2xl border bg-card p-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>URL da imagem</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." data-testid="gallery-form-url" /></div>
          <div className="space-y-1.5"><Label>Legenda (opcional)</Label><Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="Ex.: Esmaltação em gel nude" data-testid="gallery-form-caption" /></div>
          <Button className="rounded-full" disabled={!valid || add.isPending} onClick={() => add.mutate()} data-testid="gallery-form-submit"><Plus className="size-4" /> Adicionar foto</Button>
        </div>
        <div className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-blush text-xs text-muted-foreground">
          {valid ? <img src={form.image_url} alt="Pré-visualização" className="size-full object-cover" data-testid="gallery-form-preview" /> : "Pré-visualização"}
        </div>
      </section>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" data-testid="admin-gallery-list">
        {isLoading && <div className="aspect-square animate-pulse rounded-2xl bg-blush" />}
        {!isLoading && !data?.length && <p className="col-span-full rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma foto ainda.</p>}
        {data?.map((g) => (
          <figure key={g.id} data-testid={`admin-gallery-item-${g.id}`} className="group relative overflow-hidden rounded-2xl border bg-card">
            <img src={g.image_url} alt={g.caption} className="aspect-square w-full object-cover" />
            <figcaption className="truncate p-2 text-xs text-muted-foreground">{g.caption || "Sem legenda"}</figcaption>
            <Button size="icon-sm" variant="destructive" className="absolute top-2 right-2 opacity-90" onClick={() => { if (confirm("Remover esta foto?")) del.mutate(g.id); }} data-testid={`admin-gallery-delete-${g.id}`} aria-label="Remover"><Trash2 className="size-4" /></Button>
          </figure>
        ))}
      </div>
    </div>
  );
}
