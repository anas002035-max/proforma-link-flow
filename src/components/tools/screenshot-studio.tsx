import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";

const DEVICES = [
  { id: "iphone", name: "iPhone 6.7\"", w: 1290, h: 2796, radius: 56, safeTop: 0.09, safeBottom: 0.05 },
  { id: "ipad", name: "iPad 12.9\"", w: 2048, h: 2732, radius: 24, safeTop: 0.06, safeBottom: 0.04 },
  { id: "android", name: "Android Phone", w: 1080, h: 1920, radius: 28, safeTop: 0.07, safeBottom: 0.04 },
] as const;

export default function ScreenshotStudio() {
  const [device, setDevice] = useState<(typeof DEVICES)[number]>(DEVICES[0]);
  const [image, setImage] = useState<string | null>(null);
  const [headline, setHeadline] = useState("Route every click");
  const [sub, setSub] = useState("Geo-targeting built in");
  const [bg1, setBg1] = useState("#f8fafc");
  const [bg2, setBg2] = useState("#0f2c3f");
  const [showSafe, setShowSafe] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  function exportPng() {
    const c = document.createElement("canvas");
    c.width = device.w; c.height = device.h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, device.w, device.h);
    g.addColorStop(0, bg1); g.addColorStop(1, bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, device.w, device.h);

    ctx.textAlign = "center";
    ctx.fillStyle = "#F8FAFC";
    ctx.font = `800 ${Math.round(device.w * 0.075)}px system-ui, sans-serif`;
    ctx.fillText(headline, device.w / 2, device.h * 0.11);
    ctx.fillStyle = "#94A3B8";
    ctx.font = `400 ${Math.round(device.w * 0.04)}px system-ui, sans-serif`;
    ctx.fillText(sub, device.w / 2, device.h * 0.16);

    const draw = (img?: HTMLImageElement) => {
      const fw = device.w * 0.78, fh = device.h * 0.62;
      const fx = (device.w - fw) / 2, fy = device.h * 0.24;
      ctx.save();
      ctx.beginPath();
      const r = device.radius * 2;
      ctx.roundRect(fx, fy, fw, fh, r);
      ctx.clip();
      if (img) {
        const scale = Math.max(fw / img.width, fh / img.height);
        const dw = img.width * scale, dh = img.height * scale;
        ctx.drawImage(img, fx + (fw - dw) / 2, fy + (fh - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = "#111827"; ctx.fillRect(fx, fy, fw, fh);
      }
      ctx.restore();
      ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.roundRect(fx, fy, fw, fh, r); ctx.stroke();

      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = `${device.id}-${device.w}x${device.h}.png`;
      a.click();
    };

    if (image) {
      const img = new Image();
      img.onload = () => draw(img);
      img.src = image;
    } else draw();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="glass space-y-3 p-5 lg:col-span-2">
        <div>
          <span className="text-xs font-medium text-muted-foreground">Device preset</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DEVICES.map((d) => (
              <button key={d.id} onClick={() => setDevice(d)} className={`rounded-lg border px-2 py-2 text-[11px] font-semibold ${device.id === d.id ? "border-[color:var(--primary)] text-[color:var(--primary)]" : "border-border text-muted-foreground"}`}>
                {d.name}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => fileRef.current?.click()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold hover:bg-surface-2">
          <Upload className="h-3.5 w-3.5" /> Upload app screen capture
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setImage(URL.createObjectURL(f)); }} />
        <label className="block"><span className="text-xs font-medium text-muted-foreground">Headline</span><input value={headline} onChange={(e) => setHeadline(e.target.value)} className="input mt-1" /></label>
        <label className="block"><span className="text-xs font-medium text-muted-foreground">Subtitle</span><input value={sub} onChange={(e) => setSub(e.target.value)} className="input mt-1" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-medium text-muted-foreground">Gradient A</span><input type="color" value={bg1} onChange={(e) => setBg1(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-input bg-surface" /></label>
          <label className="block"><span className="text-xs font-medium text-muted-foreground">Gradient B</span><input type="color" value={bg2} onChange={(e) => setBg2(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-input bg-surface" /></label>
        </div>
        <button onClick={() => setShowSafe((v) => !v)} className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold ${showSafe ? "border-[color:var(--primary)] text-[color:var(--primary)]" : "border-border text-muted-foreground"}`}>
          {showSafe ? "Safe zones visible" : "Safe zones hidden"}
        </button>
        <button onClick={exportPng} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90">
          <Download className="h-4 w-4" /> Export {device.w}×{device.h}
        </button>
      </div>

      <div className="glass grid place-items-center p-6 lg:col-span-3">
        <div
          className="relative w-full max-w-[320px] overflow-hidden rounded-[28px] border border-border"
          style={{ aspectRatio: `${device.w} / ${device.h}`, background: `linear-gradient(140deg, ${bg1}, ${bg2})` }}
        >
          <div className="absolute inset-x-0 top-[4%] px-5 text-center">
            <div className="text-lg font-semibold leading-tight">{headline}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
          </div>
          <div
            className="absolute left-1/2 w-[78%] -translate-x-1/2 overflow-hidden rounded-2xl border-2 border-[color:var(--primary)] bg-surface-2"
            style={{ top: "24%", height: "62%", backgroundImage: image ? `url(${image})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
          />
          {showSafe && (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 border-b border-dashed border-[color:var(--primary)]/60" style={{ height: `${device.safeTop * 100}%` }} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-dashed border-[color:var(--primary)]/60" style={{ height: `${device.safeBottom * 100}%` }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
