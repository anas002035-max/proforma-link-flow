import { useMemo, useRef, useState } from "react";
import { Download, Upload, Plus, Trash2 } from "lucide-react";

type Keyframe = { at: number; transform: string; opacity: number };

const DEFAULT_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle id="target" cx="100" cy="100" r="48" fill="none" stroke="#38bdf8" stroke-width="8" />
</svg>`;

function buildCss(selector: string, frames: Keyframe[], duration: number, iterate: boolean) {
  const sorted = [...frames].sort((a, b) => a.at - b.at);
  const body = sorted
    .map((f) => `  ${f.at}% { transform: ${f.transform || "none"}; opacity: ${f.opacity}; }`)
    .join("\n");
  return `@keyframes proforma-anim {\n${body}\n}\n${selector} {\n  animation: proforma-anim ${duration}s ease-in-out ${iterate ? "infinite" : "1 forwards"};\n  transform-origin: center;\n}`;
}

function inject(svg: string, css: string) {
  const style = `<style>${css}</style>`;
  return svg.replace(/<svg([^>]*)>/, (m) => `${m}\n${style}`);
}

export default function SvgAnimator() {
  const [svg, setSvg] = useState(DEFAULT_SVG);
  const [selector, setSelector] = useState("#target");
  const [duration, setDuration] = useState(2);
  const [loop, setLoop] = useState(true);
  const [frames, setFrames] = useState<Keyframe[]>([
    { at: 0, transform: "scale(1) rotate(0deg)", opacity: 1 },
    { at: 50, transform: "scale(1.25) rotate(180deg)", opacity: 0.6 },
    { at: 100, transform: "scale(1) rotate(360deg)", opacity: 1 },
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  const css = useMemo(() => buildCss(selector, frames, duration, loop), [selector, frames, duration, loop]);
  const animated = useMemo(() => inject(svg, css), [svg, css]);

  function exportSvg() {
    const blob = new Blob([animated], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "animated.svg"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="glass space-y-4 p-5 lg:col-span-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-2">
            <Upload className="h-3.5 w-3.5" /> Upload SVG
          </button>
          <input
            ref={fileRef} type="file" accept=".svg,image/svg+xml" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) setSvg(await f.text()); }}
          />
          <button onClick={exportSvg} className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--primary)] px-3 py-1.5 text-xs font-semibold text-[color:var(--primary-foreground)] hover:opacity-90">
            <Download className="h-3.5 w-3.5" /> Export animated SVG
          </button>
        </div>
        <textarea
          value={svg} onChange={(e) => setSvg(e.target.value)} rows={10} spellCheck={false}
          className="w-full resize-y rounded-lg border border-input bg-surface p-3 font-mono text-xs outline-none focus:border-[color:var(--primary)]"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Target selector"><input value={selector} onChange={(e) => setSelector(e.target.value)} className="input" /></Field>
          <Field label={`Duration ${duration}s`}>
            <input type="range" min={0.2} max={10} step={0.1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-[color:var(--primary)]" />
          </Field>
          <Field label="Loop">
            <button onClick={() => setLoop((v) => !v)} className={`h-9 w-full rounded-lg border text-xs font-semibold ${loop ? "border-[color:var(--primary)] text-[color:var(--primary)]" : "border-border text-muted-foreground"}`}>
              {loop ? "Infinite" : "Once"}
            </button>
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Timeline keyframes</h3>
            <button onClick={() => setFrames((f) => [...f, { at: 100, transform: "scale(1)", opacity: 1 }])} className="inline-flex items-center gap-1 text-xs text-[color:var(--primary)] hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add keyframe
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {frames.map((f, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-border bg-surface/40 p-2">
                <input type="number" min={0} max={100} value={f.at} onChange={(e) => setFrames((p) => p.map((x, j) => j === i ? { ...x, at: Number(e.target.value) } : x))} className="col-span-2 input" />
                <input value={f.transform} onChange={(e) => setFrames((p) => p.map((x, j) => j === i ? { ...x, transform: e.target.value } : x))} placeholder="scale(1) rotate(0deg)" className="col-span-6 input" />
                <input type="number" step={0.1} min={0} max={1} value={f.opacity} onChange={(e) => setFrames((p) => p.map((x, j) => j === i ? { ...x, opacity: Number(e.target.value) } : x))} className="col-span-3 input" />
                <button onClick={() => setFrames((p) => p.filter((_, j) => j !== i))} className="col-span-1 grid place-items-center text-muted-foreground hover:text-[color:var(--destructive)]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="glass p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--primary)]">Live preview</h3>
          <div className="mt-3 grid aspect-square place-items-center rounded-xl bg-surface p-6" dangerouslySetInnerHTML={{ __html: animated }} />
        </div>
        <div className="glass p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--primary)]">Generated CSS</h3>
          <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-surface p-3 font-mono text-[11px] leading-relaxed">{css}</pre>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
