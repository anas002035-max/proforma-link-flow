import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyLinks, getAllAnalytics } from "@/lib/links.functions";
import { Link2, QrCode, MousePointerClick, TrendingUp, Plus } from "lucide-react";
import { TrafficLineChart, BreakdownPie } from "@/components/analytics-charts";
import { LanguageSwitcher } from "@/components/language-switcher";
import { DevProToggle } from "@/components/dev-pro-toggle";
import { ToolCategoryGrid } from "@/components/tool-category-grid";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DevMatrix" },
      { name: "description", content: "Your DevMatrix dashboard: smart links, dynamic QR codes and engineering utilities." },
      { property: "og:title", content: "DevMatrix Dashboard" },
      { property: "og:description", content: "Smart links, dynamic QR codes and developer utilities in one clean workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
    <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-10 md:py-10">
      <header className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">Welcome back, {ctx.user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageSwitcher />
          <DevProToggle />
          <Link to="/links" className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90">
            <Plus className="h-4 w-4" /> New smart link
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total clicks" value={totalClicks} icon={<MousePointerClick className="h-4 w-4" />} />
        <StatCard label="Smart links" value={totalLinks} icon={<Link2 className="h-4 w-4" />} />
        <StatCard label="Active" value={activeLinks} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="QR codes" value={totalLinks} icon={<QrCode className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass p-6 lg:col-span-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight">Daily traffic</h2>
              <p className="text-xs text-muted-foreground">Last 14 days</p>
            </div>
            <Link to="/analytics" className="shrink-0 text-xs font-medium text-[color:var(--primary)] hover:underline">Open analytics →</Link>
          </div>
          <div className="mt-5"><TrafficLineChart logs={logs} /></div>
        </div>
        <BreakdownPie logs={logs} kind="country" title="Top countries" />
      </div>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-sm font-semibold tracking-tight">Engineering utilities</h2>
          <p className="mt-1 text-xs text-muted-foreground">Pick a category to reveal its tools.</p>
        </div>
        <ToolCategoryGrid />
      </section>

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold tracking-tight">Recent links</h2>
          {links.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No links yet. <Link to="/links" className="font-medium text-[color:var(--primary)] hover:underline">Create your first smart link →</Link>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-border">
              {links.slice(0, 6).map((l) => (
                <Link key={l.id} to="/links/$id" params={{ id: l.id }} className="-mx-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-3 hover:bg-surface-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{l.title || l.slug}</div>
                    <div className="truncate text-xs text-muted-foreground">/{l.slug} → {l.default_url}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${l.is_active ? "bg-[color:var(--primary)]/[0.08] text-[color:var(--primary)]" : "bg-surface-2 text-muted-foreground"}`}>
                    {l.is_active ? "active" : "off"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <BreakdownPie logs={logs} kind="device_type" title="Devices" />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="glass p-5 hover:shadow-[var(--shadow-lift)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <span className="truncate text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
        <span className="shrink-0 text-[color:var(--primary)]">{icon}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
