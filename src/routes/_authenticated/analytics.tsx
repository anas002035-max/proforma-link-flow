import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAllAnalytics } from "@/lib/links.functions";
import { TrafficLineChart, BreakdownPie } from "@/components/analytics-charts";
import { MousePointerClick, Globe, Smartphone, Link2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Proforma Hub" }, { name: "description", content: "Live traffic analytics." }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const fn = useServerFn(getAllAnalytics);
  const { data } = useQuery({ queryKey: ["all-analytics"], queryFn: () => fn(), refetchInterval: 30000 });
  const logs = data?.logs ?? [];
  const total = data?.totalClicks ?? 0;
  const countries = new Set(logs.map((l) => l.country).filter(Boolean)).size;
  const mobileShare = logs.length ? Math.round(100 * logs.filter((l) => l.device_type === "mobile").length / logs.length) : 0;

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Live analytics</h1>
        <p className="text-sm text-muted-foreground">Traffic across all your smart links — refreshes every 30s.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total clicks" value={total} icon={<MousePointerClick />} />
        <Stat label="Links" value={data?.links.length ?? 0} icon={<Link2 />} />
        <Stat label="Countries" value={countries} icon={<Globe />} />
        <Stat label="Mobile %" value={`${mobileShare}%`} icon={<Smartphone />} />
      </div>

      <div className="mt-6 glass p-5">
        <h2 className="text-sm font-semibold text-muted-foreground">Daily traffic — last 14 days</h2>
        <div className="mt-3"><TrafficLineChart logs={logs} /></div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BreakdownPie logs={logs} kind="country" title="Countries" />
        <BreakdownPie logs={logs} kind="device_type" title="Devices" />
        <BreakdownPie logs={logs} kind="os" title="Operating systems" />
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-[color:var(--neon-blue)]">{icon}</span>
      </div>
      <div className="mt-3 text-3xl font-black">{value}</div>
    </div>
  );
}
