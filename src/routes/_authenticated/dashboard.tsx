import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyLinks, getAllAnalytics } from "@/lib/links.functions";
import { Link2, QrCode, MousePointerClick, TrendingUp, Plus, Wrench, BarChart3 } from "lucide-react";
import { TrafficLineChart, BreakdownPie } from "@/components/analytics-charts";
import { LanguageSwitcher } from "@/components/language-switcher";
import { DevProToggle } from "@/components/dev-pro-toggle";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — DevMatrix" }, { name: "description", content: "Your DevMatrix dashboard." }] }),
  component: Dashboard,
});

function Dashboard() {
  const ctx = useRouteContext({ from: "/_authenticated" });
  const fetchLinks = useServerFn(listMyLinks);
  const fetchAnalytics = useServerFn(getAllAnalytics);
  const { data: links = [] } = useQuery({ queryKey: ["my-links"], queryFn: () => fetchLinks() });
  const { data: analytics } = useQuery({ queryKey: ["all-analytics"], queryFn: () => fetchAnalytics(), refetchInterval: 30000 });

  const totalLinks = links.length;
  const activeLinks = links.filter((l) => l.is_active).length;
  const totalClicks = analytics?.totalClicks ?? 0;
  const logs = analytics?.logs ?? [];

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {ctx.user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageSwitcher />
          <DevProToggle />
          <Link to="/links" className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-neon)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90">
            <Plus className="h-4 w-4" /> New smart link
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total clicks" value={totalClicks} icon={<MousePointerClick />} accent="blue" />
        <StatCard label="Smart links" value={totalLinks} icon={<Link2 />} accent="green" />
        <StatCard label="Active" value={activeLinks} icon={<TrendingUp />} accent="blue" />
        <StatCard label="QR codes" value={totalLinks} icon={<QrCode />} accent="green" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Daily traffic</h2>
              <p className="text-xs text-muted-foreground">Last 14 days</p>
            </div>
            <Link to="/analytics" className="text-xs text-[color:var(--neon-blue)] hover:underline">Open analytics →</Link>
          </div>
          <div className="mt-4"><TrafficLineChart logs={logs} /></div>
        </div>
        <BreakdownPie logs={logs} kind="country" title="Top countries" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownPie logs={logs} kind="device_type" title="Devices" />
        <BreakdownPie logs={logs} kind="os" title="Operating systems" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Recent links</h2>
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
          <h2 className="text-lg font-semibold">Explore tools</h2>
          <div className="mt-4 space-y-2">
            <ToolLink to="/qr" icon={<QrCode className="h-4 w-4" />} label="Dynamic QR codes" />
            <ToolLink to="/bio" icon={<Link2 className="h-4 w-4" />} label="Bio page builder" />
            <ToolLink to="/analytics" icon={<BarChart3 className="h-4 w-4" />} label="Live analytics" />
            <ToolLink to="/tools" icon={<Wrench className="h-4 w-4" />} label="Engineering tools" />
          </div>
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

function ToolLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm hover:bg-surface hover:shadow-[var(--glow-blue)]">
      <span className="text-[color:var(--neon-blue)]">{icon}</span>{label}
    </Link>
  );
}
