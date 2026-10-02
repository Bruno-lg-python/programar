import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { CalendarHeart, Clock, Instagram, MapPin, MessageCircle, ShieldCheck, Sparkles, Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, DAY_LABEL, FALLBACK_IMG, fmtDuration, money, useGallery, useServices, useSettings, waLink } from "@/lib/format";
import type { Category } from "@/lib/types";

const HERO = "https://images.unsplash.com/photo-1632345031435-8727f6897d53?crop=entropy&cs=srgb&fm=jpg&q=85&w=1800";
const FILTERS: Array<"todos" | Category> = ["todos", "manicure", "pedicure", "outros"];

export default function Home() {
  const { data: s } = useSettings();
  const { data: services, isLoading, isError } = useServices();
  const { data: gallery } = useGallery();
  const [filter, setFilter] = useState<"todos" | Category>("todos");
  const list = (services ?? []).filter((x) => filter === "todos" || x.category === filter);
  const wa = waLink(s?.whatsapp ?? "11987654321", "Olá! Gostaria de saber mais sobre os atendimentos.");

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <img src={HERO} alt="Nail designer aplicando esmalte" className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(to right, rgba(28,25,23,0.9), rgba(28,25,23,0.55)), radial-gradient(circle at 80% 20%, rgba(200,130,140,0.18), transparent 60%)" }} />
        <SiteHeader transparent />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 md:pb-28 md:pt-24 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <Badge className="mb-6 h-7 gap-1.5 rounded-full border-white/20 bg-white/10 px-3 text-white backdrop-blur" data-testid="hero-badge">
                <Sparkles className="size-3.5 text-gold" /> Nail Designer • Atendimento com hora marcada
              </Badge>
              <h1 data-testid="hero-title" className="text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl lg:text-6xl">
                {s?.tagline ?? "Unhas impecáveis, cuidado de verdade."}
              </h1>
              <p data-testid="hero-subtitle" className="mt-6 max-w-xl text-base text-[#E7E5E4] sm:text-lg">
                Olá, eu sou <strong className="text-white">{s?.professional_name ?? "Isabella Martins"}</strong>. Manicure e pedicure com técnica, higiene e muito carinho — agende em menos de 1 minuto.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/agendar" data-testid="hero-book-button" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-7 text-base shadow-lg shadow-primary/40 transition-transform hover:-translate-y-0.5")}>
                  <CalendarHeart className="size-5" /> Agendar horário
                </Link>
                <a href="#servicos" data-testid="hero-services-button" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 rounded-full border-white/30 bg-white/10 px-7 text-base text-white backdrop-blur hover:bg-white/20 hover:text-white")}>
                  Ver serviços
                </a>
                <a href={wa} target="_blank" rel="noreferrer" data-testid="hero-whatsapp-button" className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "h-12 rounded-full px-5 text-base text-white hover:bg-white/10 hover:text-white")}>
                  <MessageCircle className="size-5 text-[#86EFAC]" /> Falar pelo WhatsApp
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#E7E5E4]">
                <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-gold" /> Materiais esterilizados</span>
                <span className="flex items-center gap-2"><Star className="size-4 text-gold" /> +2.000 atendimentos</span>
                <span className="flex items-center gap-2"><Clock className="size-4 text-gold" /> Pontualidade</span>
              </div>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="hidden lg:col-span-5 lg:block">
            <div className="relative ml-auto w-80">
              <img src={s?.photo_url} alt={s?.professional_name} data-testid="hero-professional-photo" className="aspect-[4/5] w-full rounded-[2rem] border border-white/20 object-cover shadow-2xl" />
              <div className="absolute -bottom-6 -left-10 animate-float-slow rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur-xl">
                <p className="text-xs text-[#E7E5E4]">Sinal para confirmar</p>
                <p className="font-heading text-2xl">{s?.deposit_percent ?? 40}%</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="servicos" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8 md:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="text-sm font-medium tracking-[0.2em] text-primary uppercase">Serviços</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Escolha o seu momento de cuidado</h2>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                data-testid={`services-filter-${f}`}
                onClick={() => setFilter(f)}
                className={cn(
                  "h-10 rounded-full border px-4 text-sm transition-colors",
                  filter === f ? "border-primary bg-primary text-white" : "border-border bg-white hover:border-primary/50",
                )}
              >
                {f === "todos" ? "Todos" : CATEGORY_LABEL[f]}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-3xl bg-blush" />)}
          {isError && <p className="text-muted-foreground" data-testid="services-error">Não foi possível carregar os serviços agora.</p>}
          {list.map((svc, i) => (
            <motion.article
              key={svc.id}
              data-testid={`service-card-${svc.id}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={cn("group overflow-hidden rounded-3xl border bg-card shadow-sm transition-shadow hover:shadow-xl", i === 0 && filter === "todos" && "lg:row-span-2")}
            >
              <div className={cn("overflow-hidden", i === 0 && filter === "todos" ? "aspect-[4/3] lg:aspect-[4/5]" : "aspect-[4/3]")}>
                <img src={svc.photo_url || FALLBACK_IMG} alt={svc.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="secondary" className="rounded-full">{CATEGORY_LABEL[svc.category]}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" />{fmtDuration(svc.duration)}</span>
                </div>
                <h3 className="mt-4 text-xl">{svc.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{svc.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-heading text-2xl text-primary" data-testid={`service-price-${svc.id}`}>{money(svc.price)}</span>
                  <Link to={`/agendar?servico=${svc.id}`} data-testid={`service-book-${svc.id}`} className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
                    Agendar
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      {!!gallery?.length && (
        <section id="trabalhos" className="mx-auto max-w-7xl scroll-mt-20 px-5 pb-20 sm:px-8 md:pb-28" data-testid="gallery-section">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-medium tracking-[0.2em] text-primary uppercase">Trabalhos</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">Um pouco do meu portfólio</h2>
            </div>
            {s && (
              <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" data-testid="gallery-instagram-link" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Instagram className="size-4" /> Veja mais em @{s.instagram}
              </a>
            )}
          </div>
          <div className="mt-10 columns-2 gap-4 md:columns-3 [&>figure]:mb-4">
            {gallery.map((g, i) => (
              <motion.figure
                key={g.id}
                data-testid={`gallery-item-${g.id}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 6) * 0.06 }}
                className="group relative break-inside-avoid overflow-hidden rounded-3xl"
              >
                <img src={g.image_url} alt={g.caption || "Trabalho"} loading="lazy" className={cn("w-full object-cover transition-transform duration-500 group-hover:scale-105", i % 3 === 0 ? "aspect-[3/4]" : "aspect-square")} />
                {g.caption && (
                  <figcaption className="absolute inset-x-3 bottom-3 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium backdrop-blur transition-opacity md:opacity-0 md:group-hover:opacity-100">{g.caption}</figcaption>
                )}
              </motion.figure>
            ))}
          </div>
        </section>
      )}

      {/* ABOUT */}
      <section id="sobre" className="scroll-mt-20 bg-blush">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 md:grid-cols-12 md:py-28">
          <div className="md:col-span-5">
            <img src={s?.photo_url} alt={s?.professional_name} data-testid="about-photo" className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-xl" />
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="text-sm font-medium tracking-[0.2em] text-primary uppercase">Sobre mim</p>
            <h2 className="mt-3 text-3xl sm:text-4xl" data-testid="about-name">{s?.professional_name ?? "Isabella Martins"}</h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground" data-testid="about-bio">{s?.bio}</p>
            <div className="mt-8 rounded-2xl border border-border bg-white/70 p-6 backdrop-blur">
              <p className="font-heading text-lg">Como funciona o atendimento</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground" data-testid="about-service-info">{s?.service_info}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contato" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8 md:py-28">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border bg-card p-8 lg:col-span-1">
            <Clock className="size-6 text-primary" />
            <h3 className="mt-4 text-2xl">Horário de funcionamento</h3>
            <ul className="mt-6 space-y-2 text-sm" data-testid="business-hours-list">
              {(s?.hours ?? []).map((h) => (
                <li key={h.day} className="flex justify-between border-b border-dashed border-border pb-2">
                  <span>{DAY_LABEL[h.day]}</span>
                  <span className={h.open ? "font-medium" : "text-muted-foreground"}>{h.open ? `${h.start} – ${h.end}` : "Fechado"}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border bg-card p-8">
            <MapPin className="size-6 text-primary" />
            <h3 className="mt-4 text-2xl">Localização</h3>
            <p className="mt-4 text-muted-foreground" data-testid="contact-address">{s?.address}<br />{s?.city}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s?.address ?? ""} ${s?.city ?? ""}`)}`}
              target="_blank"
              rel="noreferrer"
              data-testid="contact-map-link"
              className={cn(buttonVariants({ variant: "outline" }), "mt-6 rounded-full")}
            >
              Abrir no mapa
            </a>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-white">
            <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/10" />
            <Instagram className="size-6" />
            <h3 className="mt-4 text-2xl">Vamos conversar?</h3>
            <p className="mt-4 text-white/85">Veja trabalhos recentes no Instagram ou tire dúvidas pelo WhatsApp.</p>
            <div className="mt-6 flex flex-col gap-3">
              <a href={`https://instagram.com/${s?.instagram ?? ""}`} target="_blank" rel="noreferrer" data-testid="contact-instagram-link" className={cn(buttonVariants({ variant: "secondary" }), "rounded-full")}>
                <Instagram className="size-4" /> @{s?.instagram ?? "bellanails.studio"}
              </a>
              <a href={wa} target="_blank" rel="noreferrer" data-testid="contact-whatsapp-link" className={cn(buttonVariants({ variant: "outline" }), "rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white")}>
                <MessageCircle className="size-4" /> Falar pelo WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      <a href={wa} target="_blank" rel="noreferrer" data-testid="floating-whatsapp-button" aria-label="WhatsApp" className="fixed right-5 bottom-5 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/20 transition-transform hover:scale-110">
        <MessageCircle className="size-7" />
      </a>
    </div>
  );
}
