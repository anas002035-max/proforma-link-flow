import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyLinks } from "@/lib/links.functions";
import { QRPreview } from "@/components/qr-preview";
import { QrCode, Plus } from "lucide-react";
import { useState } from "react";
import { sanitizeUrl, isValidUrl } from "@/lib/url";

export const Route = createFileRoute("/_authenticated/qr")({
  head: () => ({ meta: [{ title: "QR Codes — Proforma Hub" }, { name: "description", content: "Design and download dynamic QR codes." }] }),
  component: QRPage,
});

function QRPage() {
  const fetch = useServerFn(listMyLinks);
  const { data: links = [] } = useQuery({ queryKey: ["my-links"], queryFn: () => fetch() });
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const [custom, setCustom] = useState("");
  const [fg, setFg] = useState("#0B0F19");
  const [bg, setBg] = useState("#FFFFFF");
  const clean = sanitizeUrl(custom);

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">QR codes</h1>
        <p className="text-sm text-muted-foreground">Dynamic QRs update instantly — swap the destination without reprinting.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><QrCode className="h-4 w-4 text-[color:var(--neon-blue)]" /> Quick generator</h2>
          <label className="text-xs font-medium text-muted-foreground">Any URL</label>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onBlur={(e) => setCustom(sanitizeUrl(e.target.value))}
            placeholder="https://…"
            className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-[color:var(--neon-blue)] focus:shadow-[var(--glow-blue)]"
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs">Foreground<input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="mt-1 h-9 w-full rounded border border-input bg-surface" /></label>
            <label className="text-xs">Background<input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="mt-1 h-9 w-full rounded border border-input bg-surface" /></label>
          </div>
          <div className="mt-4 grid place-items-center">
            {isValidUrl(clean)
              ? <QRPreview value={clean} fg={fg} bg={bg} size={200} />
              : <div className="grid h-52 w-full place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">Enter a URL to preview</div>}
          </div>
        </div>

        <div className="glass p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your smart-link QRs</h2>
            <Link to="/links" className="inline-flex items-center gap-1 text-xs text-[color:var(--neon-blue)] hover:underline">
              <Plus className="h-3 w-3" /> New link
            </Link>
          </div>
          {links.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Create a smart link and its dynamic QR appears here.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {links.map((l) => (
                <Link key={l.id} to="/links/$id" params={{ id: l.id }} className="glass flex flex-col items-center gap-2 p-4 transition hover:shadow-[var(--glow-blue)]">
                  <QRPreview value={`${origin}/api/public/r/${l.slug}`} fg="#0B0F19" bg="#FFFFFF" size={140} />
                  <div className="w-full truncate text-center text-xs font-semibold">{l.title || l.slug}</div>
                  <div className="w-full truncate text-center text-[10px] text-[color:var(--neon-blue)]">/{l.slug}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
