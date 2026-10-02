import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/format";

export default function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const { data: s } = useSettings();
  const name = s?.business_name ?? "Bella Nails Studio";
  return (
    <header
      data-testid="site-header"
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-xl",
        transparent ? "border-white/10 bg-ink/40 text-white" : "border-border bg-ivory/80 text-foreground",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" data-testid="header-logo-link" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-white shadow-md shadow-primary/30">
            <Sparkles className="size-4" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight sm:text-xl">{name}</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          <a href="/#servicos" data-testid="nav-services-link" className="opacity-80 transition-opacity hover:opacity-100">Serviços</a>
          <a href="/#sobre" data-testid="nav-about-link" className="opacity-80 transition-opacity hover:opacity-100">Sobre</a>
          <a href="/#contato" data-testid="nav-contact-link" className="opacity-80 transition-opacity hover:opacity-100">Contato</a>
        </nav>
        <Link to="/agendar" data-testid="header-book-button" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-5")}>
          Agendar
        </Link>
      </div>
    </header>
  );
}
