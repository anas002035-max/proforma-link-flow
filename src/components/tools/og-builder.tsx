import { useEffect, useRef, useState } from "react";
import { Download, Copy, Check } from "lucide-react";

export default function OgBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState("Route every click the smart way");
  const [subtitle, setSubtitle] = useState("proforma.link — smart links, dynamic QR, bio pages");
  const [badge, setBadge] = useState("PROFORMA HUB");
  const [align, setAlign] = useState<"left" | "center">("left");
  const [accent, setAccent] = useState("#38bdf8");
  const [accent2, setAccent2] = useState("#4ade80");
  const [bg, setBg] = useState("#0B0F19");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = 1200, H = 630;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(150, 60, 0, 150, 60, 700);
    glow.addColorStop(0, accent + "44");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, H - 14, W, H);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, accent2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - 14, W, 14);

    const x = align === "left" ? 80 : W / 2;
    ctx.textAlign = align === "left" ? "left" : "center";

    ctx.fillStyle = accent2;
    ctx.font = "600 24px system-ui, sans-serif";
    ctx.fillText(badge, x, 140);

    ctx.fillStyle = "#F8FAFC";
    ctx.font = "800 68px system-ui, sans-serif";
    wrap(ctx, title, x, 240, W - 160, 78);

    ctx.fillStyle = "#94A3B8";
    ctx.font = "400 28px system-ui, sans-serif";
    wrap(ctx, subtitle, x, 470, W - 200, 40);
  }, [title, subtitle, badge, align, accent, accent2, bg]);

  const snippet = `<meta property="og:title" content="${title}" />
<meta property="og:description" content="${subtitle}" />
<meta property="og:image" content="https://your-domain.com/og.png" />
<meta name="twitter:card" content="summary_large_image" />`;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="glass space-y-3 p-5 lg:col-span-2">
        <Text label="Badge" value={badge} onChange={setBadge} />
        <Text label="Headline" value={title} onChange={setTitle} />
        <Text label="Subtitle" value={subtitle} onChange={setSubtitle} />
        <div className="grid grid-cols-3 gap-3">
          <Color label="Accent" value={accent} onChange={setAccent} />
          <Color label="Accent 2" value={accent2} onChange={setAccent2} />
          <Color label="Background" value={bg} onChange={setBg} />
        </div>
        <div className="flex gap-2">
          {(["left", "center"] as const).map((a) => (
            <button key={a} onClick={() => setAlign(a)} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold capitalize ${align === a ? "border-[color:var(--neon-blue)] text-[color:var(--neon-blue)]" : "border-border text-muted-foreground"}`}>{a}</button>
          ))}
        </div>
        <button
          onClick={() => {
            const url = canvasRef.current?.toDataURL("image/png");
            if (!url) return;
            const a = document.createElement("a");
            a.href = url; a.download = "og-image.png"; a.click();
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-neon)] px-4 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Export PNG (1200×630)
        </button>
      </div>

      <div className="space-y-4 lg:col-span-3">
        <div className="glass p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--neon-blue)]">Preview</h3>
          <canvas ref={canvasRef} width={1200} height={630} className="mt-3 w-full rounded-xl border border-border" />
        </div>
        <div className="glass p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--neon-blue)]">Meta tags</h3>
            <button onClick={() => { navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-2">
              {copied ? <Check className="h-3.5 w-3.5 text-[color:var(--neon-green)]" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-[11px] leading-relaxed">{snippet}</pre>
        </div>
      </div>
    </div>
  );
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w; yy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input mt-1" />
    </label>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-input bg-surface" />
    </label>
  );
}
