import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Lock, ArrowRight } from "lucide-react";
import { FREE_TOOLS, PRO_TOOLS, type Tool } from "@/lib/tools";
import { usePlan } from "@/hooks/use-plan";

type Category = "free" | "pro";

export function ToolCategoryGrid() {
  const { isPro } = usePlan();
  const [open, setOpen] = useState<Category | null>("free");

  return (
    <div className="space-y-3">
      <CategoryPanel
        label="Free Utilities"
        count={FREE_TOOLS.length}
        tone="neutral"
        expanded={open === "free"}
        onToggle={() => setOpen(open === "free" ? null : "free")}
        tools={FREE_TOOLS}
        unlocked
      />
      <CategoryPanel
        label="Pro Tools"
        count={PRO_TOOLS.length}
        tone="primary"
        expanded={open === "pro"}
        onToggle={() => setOpen(open === "pro" ? null : "pro")}
        tools={PRO_TOOLS}
        unlocked={isPro}
      />
    </div>
  );
}

function CategoryPanel({
  label, count, tone, expanded, onToggle, tools, unlocked,
}: {
  label: string; count: number; tone: "neutral" | "primary";
  expanded: boolean; onToggle: () => void; tools: Tool[]; unlocked: boolean;
}) {
  return (
    <section className="glass overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 text-left hover:bg-surface-2/60"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="truncate text-sm font-semibold tracking-tight">{label}</span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              tone === "primary"
                ? "bg-[color:var(--primary)]/[0.08] text-[color:var(--primary)]"
                : "bg-surface-2 text-muted-foreground"
            }`}
          >
            {count} tools
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="grid grid-cols-1 gap-3 border-t border-border px-5 py-5 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              to="/tools/$slug"
              params={{ slug: tool.slug }}
              className="group flex flex-col rounded-xl border border-border bg-surface p-4 hover:border-[color:var(--primary)]/25 hover:shadow-[var(--shadow-soft)]"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[color:var(--primary)]/[0.06] text-[color:var(--primary)]">
                  <tool.icon className="h-4.5 w-4.5" />
                </span>
                {!unlocked && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Lock className="h-3 w-3" /> Pro
                  </span>
                )}
              </div>
              <h4 className="mt-3 truncate text-sm font-semibold tracking-tight">{tool.name}</h4>
              <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">{tool.tagline}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[color:var(--primary)]">
                Launch <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
