import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyLinks } from "@/lib/links.functions";
import { Link2, QrCode, MousePointerClick, TrendingUp, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Proforma Hub" }, { name: "description", content: "Your Proforma Hub dashboard." }] }),
  component: Dashboard,
});

function Dashboard() {
  const ctx = useRouteContext({ from: "/_authenticated" });
  const fetchLinks = useServerFn(listMyLinks);
  const { data: links = [] } = useQuery({ queryKey: ["my-links"], queryFn: () => fetchLinks() });

  const totalLinks = links.length;
  const activeLinks = links.filter((l) => l.is_active).length;
  const expiringSoon = links.filter((l) => l.expires_at && new Date(l.expires_at).getTime() - Date.now() < 7 * 86400000).length;

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {ctx.user.email}</p>
        </div>
        <Link to="/links" className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-neon)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90">
          <Plus className="h-4 w-4" /> New smart link
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Links" value={totalLinks} icon={<Link2 />} accent="blue" />
        <StatCard label="Active" value={activeLinks} icon={<TrendingUp />} accent="green" />
        <StatCard label="Expiring Soon" value={expiringSoon} icon={<MousePointerClick />} accent="blue" />
        <StatCard label="QR Codes" value={totalLinks} icon={<QrCode />} accent="green" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Recent Links</h2>
          {links.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No links yet. <Link to="/links" className="text-[color:var(--neon-blue)] hover:underline">Create your first smart link →</Link>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-border/60">
              {links.slice(0, 6).map((l) => (
                <Link key={l.id} to="/links/$id" params={{ id: l.id }} className="flex items-center justify-between py-3 hover:bg-surface/40 -mx-2 px-2 rounded">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{l.title || l.slug}</div>
                    <div className="text-xs text-muted-foreground truncate">/{l.slug} → {l.default_url}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${l.is_active ? "bg-[color:var(--neon-green)]/10 text-[color:var(--neon-green)]" : "bg-muted text-muted-foreground"}`}>
                    {l.is_active ? "active" : "off"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="glass p-6">
          <h2 className="text-lg font-semibold">Quick tips</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>• Add per-country URLs in the geo rules JSON.</li>
            <li>• Enable deep linking to open native apps.</li>
            <li>• Set an expiry date to auto-redirect to the expired page.</li>
            <li>• Print the QR — swap the destination anytime.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: "blue" | "green" }) {
  const color = accent === "blue" ? "text-[color:var(--neon-blue)]" : "text-[color:var(--neon-green)]";
  return (
    <div className="glass p-5 hover:translate-y-[-2px]">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className="mt-3 text-3xl font-black">{value}</div>
    </div>
  );
}
