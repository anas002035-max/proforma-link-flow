import { createFileRoute } from "@tanstack/react-router";
import { Check, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing & Plans — Proforma Hub" }, { name: "description", content: "Upgrade to Proforma Pro." }] }),
  component: BillingPage,
});

const FREE = [
  "Up to 5 smart links",
  "Basic short URLs",
  "Standard QR codes",
  "1 bio page",
  "7-day click history",
];
const PRO = [
  "Unlimited smart links",
  "Advanced geo-targeting",
  "Native app deep-linking",
  "Live pie chart analytics",
  "Unlimited bio pages",
  "Custom QR styling",
  "Priority support",
];

function BillingPage() {
  return (
    <div className="p-6 md:p-10">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--neon-green)]" /> Simple pricing
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Route smarter. <span className="bg-[image:var(--gradient-neon)] bg-clip-text text-transparent">Pay less.</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Cancel anytime. No hidden fees.</p>
      </header>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        <PlanCard
          name="Free"
          price="$0"
          period="forever"
          features={FREE}
          cta="Current plan"
          onClick={() => toast.info("You are on Free.")}
          highlight={false}
        />
        <PlanCard
          name="Pro"
          price="$2"
          period="per month"
          features={PRO}
          cta="Upgrade to Pro"
          onClick={() => toast.success("Checkout will open here once payments are enabled.")}
          highlight
        />
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
        Payments are processed securely via Stripe or Paddle. Enable payments from the setup panel to activate checkout.
      </p>
    </div>
  );
}

function PlanCard({ name, price, period, features, cta, onClick, highlight }: {
  name: string; price: string; period: string; features: string[]; cta: string; onClick: () => void; highlight: boolean;
}) {
  return (
    <div className={`glass relative p-7 ${highlight ? "shadow-[var(--glow-blue)] border-[color:var(--neon-blue)]/40" : ""}`}>
      {highlight && (
        <span className="absolute -top-3 right-6 rounded-full bg-[image:var(--gradient-neon)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[color:var(--primary-foreground)]">
          Most popular
        </span>
      )}
      <div className="flex items-center gap-2">
        {highlight && <Zap className="h-4 w-4 text-[color:var(--neon-blue)]" />}
        <h2 className="text-xl font-bold">{name}</h2>
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-5xl font-black tracking-tight">{price}</span>
        <span className="text-sm text-muted-foreground">/ {period}</span>
      </div>
      <button
        onClick={onClick}
        className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
          highlight
            ? "bg-[image:var(--gradient-neon)] text-[color:var(--primary-foreground)] hover:opacity-90"
            : "border border-border bg-surface hover:bg-surface-2"
        }`}
      >
        {cta}
      </button>
      <ul className="mt-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "text-[color:var(--neon-green)]" : "text-muted-foreground"}`} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
