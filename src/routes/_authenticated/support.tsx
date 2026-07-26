import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Coffee, Check, Server, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Support DevMatrix — Keep the utilities free" },
      { name: "description", content: "Support DevMatrix server sustainability with a $1 coffee micro-donation." },
      { property: "og:title", content: "Support DevMatrix" },
      { property: "og:description", content: "A $1 coffee keeps the DevMatrix developer utilities online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportPage,
});

const AMOUNTS = [1, 3, 5];

function SupportPage() {
  const [amount, setAmount] = useState(1);
  const [done, setDone] = useState(false);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 md:py-14">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Support DevMatrix</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If these utilities help your daily workflow, support our server sustainability with just $1.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-[1fr_260px]">
        <div className="glass p-6">
          <h2 className="text-sm font-semibold tracking-tight">Choose an amount</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                  amount === a
                    ? "border-[color:var(--primary)] bg-[color:var(--primary)]/[0.07] text-[color:var(--primary)]"
                    : "border-border bg-surface text-muted-foreground hover:bg-surface-2"
                }`}
              >
                ${a}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setDone(true); toast.success(`Checkout mockup — $${amount} coffee`); }}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90"
          >
            {done ? <Check className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
            {done ? "Thank you!" : `Buy us a coffee — $${amount}`}
          </button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Demo checkout — no payment is processed.
          </p>
        </div>

        <aside className="glass p-6">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-[color:var(--primary)]" />
            <h2 className="text-sm font-semibold tracking-tight">Where it goes</h2>
          </div>
          <ul className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <li>Edge hosting and redirect capacity</li>
            <li>Analytics storage and retention</li>
            <li>New engineering utilities</li>
          </ul>
          <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-[color:var(--primary)]" /> Thank you for keeping it free.
          </div>
        </aside>
      </div>
    </div>
  );
}
