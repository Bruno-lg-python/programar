import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPatch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { maskPhone, waLink } from "@/lib/format";
import type { Message, MessageKind } from "@/lib/types";

const KIND_LABEL: Record<MessageKind, string> = { confirmacao: "Confirmação", lembrete_dia: "Lembrete do dia", lembrete_15min: "15 min antes" };

export default function AdminMessages() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "messages"], queryFn: () => apiGet<Message[]>("/admin/messages"), refetchInterval: 60000 });
  const sent = useMutation({
    mutationFn: (id: string) => apiPatch<Message>(`/admin/messages/${id}/sent`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "messages"] }),
  });

  return (
    <div>
      <h1 className="text-3xl" data-testid="admin-messages-title">Fila de WhatsApp</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Mensagens geradas automaticamente: confirmação após o pagamento, lembrete no dia do atendimento e 15 minutos antes.
        <span className="ml-1 rounded bg-[#FEF3C7] px-1.5 py-0.5 text-xs font-medium text-[#78350F]">Envio simulado</span> — clique em "Enviar" para abrir o WhatsApp com o texto pronto.
      </p>
      <div className="mt-6 space-y-3" data-testid="admin-messages-list">
        {isLoading && <div className="h-24 animate-pulse rounded-2xl bg-blush" />}
        {!isLoading && !data?.length && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground" data-testid="admin-messages-empty">Nenhuma mensagem na fila ainda.</p>}
        {data?.map((m) => (
          <div key={m.id} data-testid={`admin-message-${m.id}`} className="flex flex-col gap-4 rounded-2xl border bg-card p-4 md:flex-row md:items-start">
            <div className="md:w-48 md:shrink-0">
              <p className="font-medium">{m.client_name}</p>
              <p className="text-xs text-muted-foreground">{maskPhone(m.phone)}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="rounded-full" data-testid={`admin-message-kind-${m.id}`}>{KIND_LABEL[m.kind]}</Badge>
                <Badge className={cn("rounded-full border-0", m.status === "enviada" ? "bg-[#DCF8C6] text-[#064E3B]" : "bg-[#FEF3C7] text-[#78350F]")} data-testid={`admin-message-status-${m.id}`}>
                  {m.status === "enviada" ? "Enviada" : "Pendente"}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
            </div>
            <p className="flex-1 whitespace-pre-line rounded-2xl rounded-tl-sm bg-[#DCF8C6] p-3 text-sm text-[#064E3B]">{m.text}</p>
            <a
              href={waLink(m.phone, m.text)}
              target="_blank"
              rel="noreferrer"
              onClick={() => m.status === "pendente" && sent.mutate(m.id)}
              data-testid={`admin-message-send-${m.id}`}
              className={cn("inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors", m.status === "pendente" ? "bg-[#25D366] text-white hover:bg-[#1ebe5a]" : "border text-muted-foreground hover:bg-secondary")}
            >
              {m.status === "pendente" ? <><Send className="size-4" /> Enviar</> : <><Check className="size-4" /> Reenviar</>}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
