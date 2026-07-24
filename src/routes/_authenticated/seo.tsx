import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Tag, Link2, FileText, Copy } from "lucide-react";
import { toast } from "sonner";
import { sanitizeUrl } from "@/lib/url";

export const Route = createFileRoute("/_authenticated/seo")({
  head: () => ({ meta: [{ title: "SEO Toolkit — Proforma Hub" }, { name: "description", content: "SEO and marketing utilities." }] }),
  component: SEOPage,
});

const fld = "w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-[color:var(--neon-blue)] focus:shadow-[var(--glow-blue)]";
const lbl = "block text-xs font-medium text-muted-foreground mb-1";

function SEOPage() {
  return (
    <div className="p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">SEO toolkit</h1>
        <p className="text-sm text-muted-foreground">Meta tags, UTM builder, slug generator, and keyword tools.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Meta tag generator" icon={<Tag className="h-4 w-4" />}><MetaGen /></Card>
        <Card title="UTM link builder" icon={<Link2 className="h-4 w-4" />}><UTM /></Card>
        <Card title="Slug generator" icon={<Search className="h-4 w-4" />}><Slug /></Card>
        <Card title="Keyword density" icon={<FileText className="h-4 w-4" />}><Density /></Card>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><span className="text-[color:var(--neon-blue)]">{icon}</span>{title}</h2>
      {children}
    </div>
  );
}

function CopyBox({ text }: { text: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-surface p-3">
      <pre className="flex-1 whitespace-pre-wrap break-all text-[11px] font-mono text-muted-foreground">{text}</pre>
      <button onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied"); }} className="rounded p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground">
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MetaGen() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const out = useMemo(() => {
    const u = sanitizeUrl(url);
    return [
      `<title>${title}</title>`,
      `<meta name="description" content="${desc}" />`,
      u && `<link rel="canonical" href="${u}" />`,
      `<meta property="og:title" content="${title}" />`,
      `<meta property="og:description" content="${desc}" />`,
      u && `<meta property="og:url" content="${u}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
    ].filter(Boolean).join("\n");
  }, [title, desc, url]);
  return (
    <div className="space-y-3">
      <div><label className={lbl}>Title ({title.length}/60)</label><input value={title} onChange={(e) => setTitle(e.target.value)} className={fld} maxLength={70} /></div>
      <div><label className={lbl}>Description ({desc.length}/160)</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} className={fld} rows={2} maxLength={180} /></div>
      <div><label className={lbl}>Canonical URL</label><input value={url} onChange={(e) => setUrl(e.target.value)} onBlur={(e) => setUrl(sanitizeUrl(e.target.value))} className={fld} placeholder="https://…" /></div>
      <CopyBox text={out} />
    </div>
  );
}

function UTM() {
  const [base, setBase] = useState("");
  const [src, setSrc] = useState("newsletter");
  const [med, setMed] = useState("email");
  const [camp, setCamp] = useState("launch");
  const out = useMemo(() => {
    const u = sanitizeUrl(base);
    if (!u) return "";
    try {
      const url = new URL(u);
      if (src) url.searchParams.set("utm_source", src);
      if (med) url.searchParams.set("utm_medium", med);
      if (camp) url.searchParams.set("utm_campaign", camp);
      return url.toString();
    } catch { return ""; }
  }, [base, src, med, camp]);
  return (
    <div className="space-y-3">
      <div><label className={lbl}>Destination URL</label><input value={base} onChange={(e) => setBase(e.target.value)} onBlur={(e) => setBase(sanitizeUrl(e.target.value))} className={fld} placeholder="https://…" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>Source</label><input value={src} onChange={(e) => setSrc(e.target.value)} className={fld} /></div>
        <div><label className={lbl}>Medium</label><input value={med} onChange={(e) => setMed(e.target.value)} className={fld} /></div>
        <div><label className={lbl}>Campaign</label><input value={camp} onChange={(e) => setCamp(e.target.value)} className={fld} /></div>
      </div>
      {out && <CopyBox text={out} />}
    </div>
  );
}

function Slug() {
  const [t, setT] = useState("");
  const slug = t.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
  return (
    <div className="space-y-3">
      <div><label className={lbl}>Text</label><input value={t} onChange={(e) => setT(e.target.value)} className={fld} placeholder="My Amazing Blog Post" /></div>
      {slug && <CopyBox text={slug} />}
    </div>
  );
}

function Density() {
  const [text, setText] = useState("");
  const stats = useMemo(() => {
    const words = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
    const total = words.length;
    const freq = new Map<string, number>();
    for (const w of words) if (w.length > 3) freq.set(w, (freq.get(w) ?? 0) + 1);
    return {
      total,
      top: [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    };
  }, [text]);
  return (
    <div className="space-y-3">
      <div><label className={lbl}>Paste your content</label><textarea value={text} onChange={(e) => setText(e.target.value)} className={fld} rows={5} /></div>
      <div className="text-xs text-muted-foreground">{stats.total} words</div>
      {stats.top.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {stats.top.map(([w, c]) => (
            <div key={w} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
              <span className="font-mono">{w}</span>
              <span className="text-[color:var(--neon-blue)]">{c}× · {((c / stats.total) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
