import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { useDevPro } from "@/hooks/use-dev-pro";

export function DevProToggle() {
  const { devPro, toggleDevPro } = useDevPro();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={devPro}
      onClick={() => {
        const next = toggleDevPro();
        toast.success(next ? "Dev Mode: Pro unlocked" : "Dev Mode off — back to Free");
      }}
      title="Temporary local Pro unlock for testing"
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
        devPro
          ? "border-[color:var(--primary)]/50 bg-[color:var(--primary)]/10 text-[color:var(--primary)] shadow-[var(--shadow-soft)]"
          : "border-border bg-surface/60 text-muted-foreground hover:text-foreground"
      }`}
    >
      <FlaskConical className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Dev Mode</span>
      <span className={`h-4 w-7 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${devPro ? "bg-[color:var(--primary)]/40" : "bg-muted"}`}>
        <span
          className={`block h-3 w-3 rounded-full bg-current transition-transform duration-200 ${devPro ? "translate-x-3" : "translate-x-0"}`}
        />
      </span>
      <span className="sr-only">{devPro ? "Pro enabled" : "Pro disabled"}</span>
    </button>
  );
}
