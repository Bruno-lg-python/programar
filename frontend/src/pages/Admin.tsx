import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CalendarOff, ExternalLink, Images, Loader2, LogOut, MessageCircle, Scissors, Settings, Sparkles } from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Message, OkOut } from "@/lib/types";
import AdminBookings from "@/components/admin/AdminBookings";
import AdminServices from "@/components/admin/AdminServices";
import AdminMessages from "@/components/admin/AdminMessages";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminBlocks from "@/components/admin/AdminBlocks";
import AdminGallery from "@/components/admin/AdminGallery";

type Tab = "agenda" | "bloqueios" | "servicos" | "galeria" | "whatsapp" | "config";
const TABS: { key: Tab; label: string; icon: typeof CalendarDays }[] = [
  { key: "agenda", label: "Agenda", icon: CalendarDays },
  { key: "bloqueios", label: "Bloqueios", icon: CalendarOff },
  { key: "servicos", label: "Serviços", icon: Scissors },
  { key: "galeria", label: "Galeria", icon: Images },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "config", label: "Configurações", icon: Settings },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>("agenda");
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["admin", "me"], queryFn: () => apiGet<OkOut>("/admin/me"), retry: false });
  const msgs = useQuery({ queryKey: ["admin", "messages"], queryFn: () => apiGet<Message[]>("/admin/messages"), enabled: me.isSuccess, refetchInterval: 60000 });
  const pending = (msgs.data ?? []).filter((m) => m.status === "pendente").length;

  if (me.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (me.error instanceof ApiError && me.error.status === 401) return <Navigate to="/admin/login" replace />;

  const logout = async () => {
    await apiPost<OkOut>("/admin/logout");
    qc.clear();
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="sticky top-0 z-30 bg-ink text-ivory md:h-screen md:w-64 md:shrink-0">
        <div className="flex items-center justify-between gap-2 p-4 md:block md:p-6">
          <Link to="/" className="flex items-center gap-2" data-testid="admin-logo-link">
            <span className="grid size-9 place-items-center rounded-full bg-primary"><Sparkles className="size-4" /></span>
            <span className="font-heading text-lg">Painel</span>
          </Link>
          <button type="button" onClick={logout} data-testid="admin-logout-button" className="flex items-center gap-1.5 text-sm text-[#D6C7C2] hover:text-white md:hidden">
            <LogOut className="size-4" /> Sair
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              data-testid={`admin-tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                tab === t.key ? "bg-primary text-white" : "text-[#D6C7C2] hover:bg-white/5 hover:text-white",
              )}
            >
              <t.icon className="size-4" /> {t.label}
              {t.key === "whatsapp" && pending > 0 && <span className="ml-auto rounded-full bg-gold px-1.5 text-xs text-ink" data-testid="admin-pending-messages-count">{pending}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-6 left-4 hidden space-y-2 md:block">
          <Link to="/" target="_blank" className="flex items-center gap-1.5 px-3.5 text-sm text-[#D6C7C2] hover:text-white" data-testid="admin-view-site-link"><ExternalLink className="size-4" /> Ver site</Link>
          <button type="button" onClick={logout} data-testid="admin-logout-button-desktop" className="flex items-center gap-1.5 px-3.5 text-sm text-[#D6C7C2] hover:text-white">
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-8">
        {tab === "agenda" && <AdminBookings />}
        {tab === "bloqueios" && <AdminBlocks />}
        {tab === "servicos" && <AdminServices />}
        {tab === "galeria" && <AdminGallery />}
        {tab === "whatsapp" && <AdminMessages />}
        {tab === "config" && <AdminSettings />}
      </main>
    </div>
  );
}
