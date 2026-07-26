import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getLink, updateQrStyle } from "@/lib/links.functions";
import { useState, useEffect } from "react";
import { QRPreview } from "@/components/qr-preview";
import { ArrowLeft, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { TrafficLineChart, BreakdownPie } from "@/components/analytics-charts";

export const Route = createFileRoute("/_authenticated/links/$id")({
  head: () => ({ meta: [{ title: "Link details — DevMatrix" }, { name: "description", content: "Link analytics and QR customizer." }] }),
  component: LinkDetail,
});

function LinkDetail() {
  const { id } = Route.useParams();
  const fetch = useServerFn(getLink);
  const save = useServerFn(updateQrStyle);
  const { data, isLoading } = useQuery({ queryKey: ["link", id], queryFn: () => fetch({ data: { id } }) });

  const [fg, setFg] = useState("#0B0F19");
  const [bg, setBg] = useState("#FFFFFF");

  useEffect(() => {
    const s = (data?.link.qr_codes?.[0]?.qr_style_settings ?? {}) as { fg?: string; bg?: string };
    if (s.fg) setFg(s.fg);
    if (s.bg) setBg(s.bg);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => save({ data: { link_id: id, settings: { fg, bg } } }),
    onSuccess: () => toast.success("QR style saved"),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const shortUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/r/${data.link.slug}` : `/api/public/r/${data.link.slug}`;

  return (
    <div className="p-6 md:p-10">
      <Link to="/links" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All links</Link>
      <header className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">{data.link.title || data.link.slug}</h1>
        <p className="text-sm text-[color:var(--neon-blue)]">{shortUrl}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold">Dynamic QR</h2>
          <p className="mt-1 text-xs text-muted-foreground">Print this — swap the destination anytime.</p>
          <div className="mt-6"><QRPreview value={shortUrl} fg={fg} bg={bg} /></div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-xs">Foreground
              <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="mt-1 h-9 w-full rounded border border-input bg-surface" />
            </label>
            <label className="text-xs">Background
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="mt-1 h-9 w-full rounded border border-input bg-surface" />
            </label>
          </div>
          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="mt-4 w-full rounded-lg bg-[image:var(--gradient-neon)] px-3 py-2 text-sm font-semibold text-[color:var(--primary-foreground)]">
            {saveMut.isPending ? "Saving…" : "Save style"}
          </button>
        </div>

        <div className="glass p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Routing rules</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Default URL" value={data.link.default_url} />
            <Row label="Deep-linking" value={data.link.deep_link_enabled ? "Enabled" : "Off"} />
            <Row label="Expires" value={data.link.expires_at ? new Date(data.link.expires_at).toLocaleString() : "Never"} />
            <div>
              <div className="text-xs text-muted-foreground">Geo rules</div>
              <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-surface p-3 text-xs font-mono">{JSON.stringify(data.link.geo_rules, null, 2)}</pre>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <MiniStat label="Clicks" value={data.analytics.length} />
            <MiniStat label="Countries" value={new Set(data.analytics.map((a) => a.country).filter(Boolean)).size} />
            <MiniStat label="Mobile" value={`${data.analytics.length ? Math.round(100 * data.analytics.filter((a) => a.device_type === "mobile").length / data.analytics.length) : 0}%`} />
          </div>

          <h2 className="mt-8 text-lg font-semibold">Daily traffic</h2>
          <div className="mt-3"><TrafficLineChart logs={data.analytics as any} /></div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <BreakdownPie logs={data.analytics as any} kind="country" title="Countries" />
            <BreakdownPie logs={data.analytics as any} kind="device_type" title="Devices" />
            <BreakdownPie logs={data.analytics as any} kind="os" title="OS" />
          </div>

          <h2 className="mt-8 text-lg font-semibold">Recent clicks</h2>
          {data.analytics.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No clicks yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr><th className="text-left py-2">Time</th><th className="text-left">Country</th><th className="text-left">Device</th><th className="text-left">OS</th></tr>
                </thead>
                <tbody>
                  {data.analytics.slice(0, 25).map((a) => (
                    <tr key={a.id} className="border-t border-border/40">
                      <td className="py-2">{new Date(a.timestamp).toLocaleString()}</td>
                      <td>{a.country || "—"}</td><td>{a.device_type || "—"}</td><td>{a.os || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/50 p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><MousePointerClick className="h-3 w-3" />{label}</div>
      <div className="mt-1 text-xl font-black text-[color:var(--neon-blue)]">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-xs text-muted-foreground">{label}</span><span className="truncate text-right">{value}</span></div>;
}
