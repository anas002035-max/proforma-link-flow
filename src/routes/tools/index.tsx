import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { FREE_TOOLS, PRO_TOOLS, type Tool } from "@/lib/tools";
import { usePlan } from "@/hooks/use-plan";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tools/")({
  head: () => ({
    meta: [
      { title: "Developer Tools — Proforma Hub" },
      { name: "description", content: "Twelve browser-native engineering tools: SVG animation, log parsing, JWT inspection, Docker architecture, schema design and more." },
      { property: "og:title", content: "Proforma Hub Engineering Tools" },
      { property: "og:description", content: "Twelve precision developer utilities that run entirely client-side." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ToolsIndex,
});

function ToolsIndex() {
  const { t } = useI18n();
  const { isPro } = usePlan();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <h1 className="text-4xl font-black tracking-tight md:text-5xl">{t("tools.title")}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">{t("tools.subtitle")}</p>

      <h2 className="mt-12 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--neon-blue)]">{t("tools.free")}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {FREE_TOOLS.map((tool) => <ToolCard key={tool.slug} tool={tool} unlocked />)}
      </div>

      <h2 className="mt-14 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--neon-green)]">{t("tools.pro")}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {PRO_TOOLS.map((tool) => <ToolCard key={tool.slug} tool={tool} unlocked={isPro} />)}
      </div>

      <div className="glass mt-14 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-lg font-bold">Proforma Pro — $2/month</h2>
          <p className="mt-1 text-sm text-muted-foreground">Unlimited smart links, dynamic QR, premium bio themes and all six Pro engineering tools.</p>
        </div>
        <Link to="/billing" className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-neon)] px-5 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90">
          <Sparkles className="h-4 w-4" /> {t("tools.upgrade")}
        </Link>
      </div>
    </div>
  );
}

function ToolCard({ tool, unlocked }: { tool: Tool; unlocked: boolean }) {
  const { t } = useI18n();
  return (
    <Link
      to="/tools/$slug"
      params={{ slug: tool.slug }}
      className={`glass group flex flex-col p-5 transition hover:translate-y-[-2px] hover:shadow-[var(--glow-blue)] ${tool.span ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-[color:var(--neon-blue)]">
          <tool.icon className="h-5 w-5" />
        </span>
        {!unlocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--neon-green)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--neon-green)]">
            <Lock className="h-3 w-3" /> {t("tools.locked")}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-base font-semibold leading-tight">{tool.name}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{tool.tagline}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--neon-blue)]">
        {t("tools.open")} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
      {/* SEO teaser text container */}
      <p className="mt-3 border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground/80">{tool.seoTitle}</p>
    </Link>
  );
}
