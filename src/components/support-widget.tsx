import { Coffee, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SupportWidget({ className = "" }: { className?: string }) {
  return (
    <div className={`glass p-5 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color:var(--primary)]/[0.08] text-[color:var(--primary)]">
          <Heart className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold tracking-tight">Support DevMatrix</h3>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        If these utilities help your daily workflow, support our server sustainability with just $1.
      </p>
      <Link
        to="/support"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--primary)]/20 bg-[color:var(--primary)]/[0.06] px-3 py-2 text-xs font-semibold text-[color:var(--primary)] hover:bg-[color:var(--primary)]/[0.12]"
      >
        <Coffee className="h-3.5 w-3.5" /> Buy us a coffee — $1
      </Link>
    </div>
  );
}
