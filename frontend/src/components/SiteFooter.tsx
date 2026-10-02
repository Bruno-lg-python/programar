import { Link } from "react-router-dom";
import { Instagram, Lock, MapPin, MessageCircle } from "lucide-react";
import { useSettings, waLink } from "@/lib/format";

export default function SiteFooter() {
  const { data: s } = useSettings();
  return (
    <footer data-testid="site-footer" className="bg-ink text-ivory">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-heading text-2xl">{s?.business_name ?? "Bella Nails Studio"}</p>
          <p className="mt-2 max-w-sm text-sm text-[#D6C7C2]">{s?.tagline}</p>
        </div>
        <div className="space-y-2 text-sm text-[#D6C7C2]">
          {s && (
            <>
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{s.address} — {s.city}</p>
              <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" data-testid="footer-instagram-link" className="flex items-center gap-2 hover:text-white">
                <Instagram className="size-4" />@{s.instagram}
              </a>
              <a href={waLink(s.whatsapp)} target="_blank" rel="noreferrer" data-testid="footer-whatsapp-link" className="flex items-center gap-2 hover:text-white">
                <MessageCircle className="size-4" />WhatsApp
              </a>
            </>
          )}
        </div>
        <div className="flex items-end md:justify-end">
          <Link to="/admin" data-testid="footer-admin-link" className="flex items-center gap-1.5 text-xs text-[#D6C7C2]/70 hover:text-white">
            <Lock className="size-3" /> Área da profissional
          </Link>
        </div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs text-[#D6C7C2]/70">© {new Date().getFullYear()} {s?.business_name ?? "Bella Nails Studio"}. Todos os direitos reservados.</p>
    </footer>
  );
}
