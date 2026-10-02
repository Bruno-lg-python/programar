import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";
import { errMsg } from "@/lib/format";
import type { OkOut } from "@/lib/types";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const login = useMutation({
    mutationFn: () => apiPost<OkOut>("/admin/login", { password }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin"] });
      navigate("/admin");
    },
    onError: (e) => toast.error(errMsg(e, "Senha incorreta")),
  });

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink px-5">
      <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute -right-24 -bottom-24 size-80 rounded-full bg-gold/20 blur-3xl" />
      <form
        onSubmit={(e) => { e.preventDefault(); login.mutate(); }}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur-2xl"
        data-testid="admin-login-form"
      >
        <span className="grid size-12 place-items-center rounded-full bg-primary"><Sparkles className="size-5" /></span>
        <h1 className="mt-6 text-3xl">Área da profissional</h1>
        <p className="mt-2 text-sm text-[#D6C7C2]">Acesse sua agenda, serviços e mensagens.</p>
        <div className="mt-8 space-y-2">
          <Label htmlFor="pw" className="text-[#D6C7C2]">Senha</Label>
          <Input id="pw" type="password" autoFocus data-testid="admin-login-password-input" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 border-white/15 bg-white/10 text-white placeholder:text-white/40" placeholder="••••••••" />
        </div>
        <Button type="submit" size="lg" disabled={!password || login.isPending} className="mt-6 h-12 w-full rounded-full text-base" data-testid="admin-login-submit-button">
          <Lock className="size-4" /> {login.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
