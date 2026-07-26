import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { usePlan } from "@/hooks/use-plan";
import { useI18n } from "@/lib/i18n";
import type { Tool } from "@/lib/tools";

export function ToolShell({ tool, children }: { tool: Tool; children: ReactNode }) {
  const { t } = useI18n();
  const { isPro, isLoading } = usePlan();
  const locked = tool.tier === "pro" && !isPro && !isLoading;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <Link to="/tools" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> {t("tools.back")}
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-[color:var(--primary)]">
              <tool.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{tool.name}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{tool.tagline}</p>
            </div>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${tool.tier === "pro" ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)]" : "bg-surface-2 text-muted-foreground"}`}>
          {tool.tier}
        </span>
      </header>

      <section className="mt-6">
        {locked ? <ProLock /> : children}
      </section>

      <SeoSection tool={tool} />
    </div>
  );
}

function ProLock() {
  const { t } = useI18n();
  return (
    <div className="glass grid place-items-center p-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-[color:var(--primary)]">
        <Lock className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-xl font-bold">{t("tools.lockedTitle")}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("tools.lockedBody")}</p>
      <Link
        to="/billing"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[color:var(--primary)] px-5 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-[var(--shadow-soft)] hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" /> {t("tools.upgrade")}
      </Link>
    </div>
  );
}

/** Semantic long-form SEO container reserved beneath every tool. */
export function SeoSection({ tool }: { tool: Tool }) {
  const { t } = useI18n();
  return (
    <article className="glass mt-10 p-6 md:p-10" data-seo-slot={tool.slug}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{t("seo.heading")}</p>
      <h2 className="mt-2 max-w-3xl text-xl font-bold leading-snug md:text-2xl">{tool.seoTitle}</h2>
      <div className="prose-invert mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>{tool.seoIntro}</p>
        <p>
          Everything runs client-side inside your browser: no file is uploaded, no payload leaves the tab, and the tool
          keeps working offline once loaded. That makes it safe for production secrets, customer logs and unreleased assets.
        </p>
      </div>
      {/* Long-form SEO article slot — inject additional sections here. */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {["Overview", "How it works", "FAQ"].map((h) => (
          <section key={h} className="rounded-xl border border-dashed border-border/70 bg-surface/30 p-4">
            <h3 className="text-sm font-semibold text-foreground">{h}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Reserved content block for the {tool.name.toLowerCase()} article.
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
