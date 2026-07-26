import { useState } from "react";
import { Upload, AlertTriangle, CheckCircle2 } from "lucide-react";

type LocaleFile = { name: string; json: Record<string, unknown> };

function flatten(obj: unknown, prefix = "", out: Record<string, unknown> = {}) {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, path, out);
      else out[path] = v;
    }
  }
  return out;
}

type Report = { name: string; missing: string[]; extra: string[]; empty: string[]; mismatched: string[] };

export default function I18nValidator() {
  const [files, setFiles] = useState<LocaleFile[]>([]);
  const [baseline, setBaseline] = useState<string>("");
  const [error, setError] = useState("");

  async function onFiles(list: FileList | null) {
    if (!list) return;
    const parsed: LocaleFile[] = [];
    for (const f of Array.from(list)) {
      try {
        parsed.push({ name: f.name, json: JSON.parse(await f.text()) });
      } catch {
        setError(`${f.name} is not valid JSON.`);
      }
    }
    if (parsed.length) {
      setFiles((prev) => [...prev.filter((p) => !parsed.some((n) => n.name === p.name)), ...parsed]);
      setBaseline((b) => b || parsed.find((p) => p.name.startsWith("en"))?.name || parsed[0].name);
      setError("");
    }
  }

  const base = files.find((f) => f.name === baseline);
  const baseFlat = base ? flatten(base.json) : {};
  const reports: Report[] = base
    ? files.filter((f) => f.name !== baseline).map((f) => {
        const flat = flatten(f.json);
        const missing = Object.keys(baseFlat).filter((k) => !(k in flat));
        const extra = Object.keys(flat).filter((k) => !(k in baseFlat));
        const empty = Object.entries(flat).filter(([, v]) => typeof v === "string" && v.trim() === "").map(([k]) => k);
        const mismatched = Object.keys(flat).filter((k) => k in baseFlat && typeof flat[k] !== typeof baseFlat[k]);
        return { name: f.name, missing, extra, empty, mismatched };
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="glass p-5">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center hover:border-[color:var(--neon-blue)]">
          <Upload className="h-6 w-6 text-[color:var(--neon-blue)]" />
          <span className="text-sm font-semibold">Drop locale JSON files</span>
          <span className="text-xs text-muted-foreground">en.json, fr.json, ja.json … multiple files supported</span>
          <input type="file" accept="application/json,.json" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        </label>
        {error && <p className="mt-3 text-xs text-[color:var(--destructive)]">{error}</p>}
        {files.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">Baseline</span>
            <select
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
              className="rounded-lg border border-input bg-surface px-3 py-1.5 text-xs outline-none [&>option]:bg-[color:var(--popover)]"
            >
              {files.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
            <span className="text-xs text-muted-foreground">{Object.keys(baseFlat).length} keys · {files.length} files</span>
            <button onClick={() => { setFiles([]); setBaseline(""); }} className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-surface">Reset</button>
          </div>
        )}
      </div>

      {reports.map((r) => {
        const clean = !r.missing.length && !r.extra.length && !r.empty.length && !r.mismatched.length;
        return (
          <div key={r.name} className="glass p-5">
            <div className="flex items-center gap-2">
              {clean
                ? <CheckCircle2 className="h-4 w-4 text-[color:var(--neon-green)]" />
                : <AlertTriangle className="h-4 w-4 text-[color:var(--destructive)]" />}
              <h3 className="font-semibold">{r.name}</h3>
              <span className="text-xs text-muted-foreground">{clean ? "fully in sync" : `${r.missing.length + r.extra.length + r.empty.length + r.mismatched.length} issues`}</span>
            </div>
            {!clean && (
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <KeyList title="Missing" keys={r.missing} tone="destructive" />
                <KeyList title="Empty values" keys={r.empty} tone="destructive" />
                <KeyList title="Type mismatch" keys={r.mismatched} tone="destructive" />
                <KeyList title="Extra keys" keys={r.extra} tone="muted" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function KeyList({ title, keys, tone }: { title: string; keys: string[]; tone: "destructive" | "muted" }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-3">
      <div className={`text-xs font-semibold ${tone === "destructive" ? "text-[color:var(--destructive)]" : "text-muted-foreground"}`}>
        {title} ({keys.length})
      </div>
      <ul className="mt-2 max-h-40 space-y-1 overflow-auto font-mono text-[11px] text-muted-foreground">
        {keys.slice(0, 200).map((k) => <li key={k} className="truncate">{k}</li>)}
        {keys.length === 0 && <li className="text-muted-foreground/60">—</li>}
      </ul>
    </div>
  );
}
