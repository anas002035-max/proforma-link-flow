import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/expired")({
  head: () => ({
    meta: [
      { title: "Offer Expired — DevMatrix" },
      { name: "description", content: "This link or offer has expired." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Expired,
});

function Expired() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass max-w-md p-10 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 text-[color:var(--primary)]">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Offer Expired</h1>
        <p className="mt-3 text-sm text-muted-foreground">This link or promotion is no longer active. Check back with the sender for a fresh one.</p>
        <Link to="/" className="mt-6 inline-flex rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2">Go to DevMatrix</Link>
      </div>
    </div>
  );
}
