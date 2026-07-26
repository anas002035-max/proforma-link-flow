import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode, Link2, Globe2, Sparkles, ArrowRight, Zap } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Proforma Hub — Smart Links, Dynamic QR & Link-in-Bio" },
      { name: "description", content: "One platform for shortened smart links, geo-targeted routing, dynamic QR codes, and link-in-bio pages." },
      { property: "og:title", content: "Proforma Hub" },
      { property: "og:description", content: "Smart Links, Dynamic QR, and Link-in-Bio." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-neon)] text-[color:var(--primary-foreground)]">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-lg font-black tracking-tight">Proforma Hub</span>
        </div>
        <nav className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link to="/tools" className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Tools</Link>
          <Link to="/auth" className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link to="/auth" className="rounded-lg bg-[image:var(--gradient-neon)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90">
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/40 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--neon-green)]" />
          Early access — pro tier launching soon
        </div>
        <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-7xl">
          Route every click
          <br />
          <span className="bg-[image:var(--gradient-neon)] bg-clip-text text-transparent">the smart way.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Shortened smart links with geo-targeting and deep-linking, dynamic QR codes you can update after printing, and a modular link-in-bio builder — all in one dashboard.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth" className="group inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-neon)] px-6 py-3 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-[var(--glow-blue)] hover:opacity-90">
            Launch your dashboard <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          <FeatureCard icon={<Link2 />} title="Smart Links" desc="One short URL, many destinations — routed by country and device with intent-based deep-linking." />
          <FeatureCard icon={<QrCode />} title="Dynamic QR" desc="Print once, swap destinations forever. Style colors and preview in real time." />
          <FeatureCard icon={<Globe2 />} title="Link-in-Bio" desc="Bento-style bio pages with live mobile preview and expiring coupons." />
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Proforma Hub
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glass p-6 text-left hover:translate-y-[-2px] hover:shadow-[var(--glow-blue)]">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-[color:var(--neon-blue)]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
