import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode, Link2, Globe2, Sparkles, ArrowRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BrandMark } from "@/components/brand-logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevMatrix — Smart Links, Dynamic QR & Link-in-Bio" },
      { name: "description", content: "One platform for shortened smart links, geo-targeted routing, dynamic QR codes, and link-in-bio pages." },
      { property: "og:title", content: "DevMatrix" },
      { property: "og:description", content: "Smart Links, Dynamic QR, and Link-in-Bio." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <BrandMark />
        <nav className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link to="/tools" className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Tools</Link>
          <Link to="/auth" className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link to="/auth" className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90">
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--primary)]" />
          Early access — pro tier launching soon
        </div>
        <h1 className="mt-6 text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">
          Route every click
          <br />
          <span className="text-[color:var(--primary)]">the smart way.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Shortened smart links with geo-targeting and deep-linking, dynamic QR codes you can update after printing, and a modular link-in-bio builder — all in one dashboard.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth" className="group inline-flex items-center gap-2 rounded-xl bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-[var(--shadow-soft)] hover:opacity-90">
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
        © {new Date().getFullYear()} DevMatrix
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glass p-6 text-left hover:translate-y-[-2px] hover:shadow-[var(--shadow-soft)]">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-[color:var(--primary)]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
