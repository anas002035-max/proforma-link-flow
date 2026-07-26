import { useRef, useState } from "react";
import { Upload, Loader2, ClipboardType, Play } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

const WORKER_SRC = `
const LINE = /^(\\S+) \\S+ \\S+ \\[([^\\]]+)\\] "(\\S+) (\\S+)[^"]*" (\\d{3}) (\\d+|-)/;
self.onmessage = async (e) => {
  const input = e.data;
  const status = {}, paths = {}, hours = {}, ips = {};
  let total = 0, bytes = 0, unparsed = 0;
  const handle = (line) => {
    if (!line.trim()) return;
    total++;
    const m = LINE.exec(line);
    if (!m) { unparsed++; return; }
    const [, ip, ts, , path, code, size] = m;
    status[code] = (status[code] || 0) + 1;
    paths[path] = (paths[path] || 0) + 1;
    ips[ip] = (ips[ip] || 0) + 1;
    const hour = ts.slice(0, 14);
    hours[hour] = (hours[hour] || 0) + 1;
    if (size !== "-") bytes += Number(size);
    if (total % 20000 === 0) self.postMessage({ type: "progress", total });
  };
  if (typeof input === "string") {
    for (const line of input.split(/\\r?\\n/)) handle(line);
  } else {
    const stream = input.stream().pipeThrough(new TextDecoderStream());
    const reader = stream.getReader();
    let carry = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = carry + value;
      const lines = chunk.split("\\n");
      carry = lines.pop() || "";
      for (const line of lines) handle(line);
    }
    handle(carry);
  }
  self.postMessage({ type: "done", result: { total, unparsed, bytes, status, paths, hours, ips } });
};
`;


type Result = {
  total: number; unparsed: number; bytes: number;
  status: Record<string, number>; paths: Record<string, number>;
  hours: Record<string, number>; ips: Record<string, number>;
};

const MAX_MB = 10;

export default function LogParser() {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [raw, setRaw] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function start(payload: File | string) {
    setError(""); setBusy(true); setProgress(0); setResult(null);
    const worker = new Worker(URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" })));
    worker.onmessage = (e) => {
      if (e.data.type === "progress") setProgress(e.data.total);
      if (e.data.type === "done") { setResult(e.data.result); setBusy(false); worker.terminate(); }
    };
    worker.onerror = () => { setError("Worker failed to parse this input."); setBusy(false); worker.terminate(); };
    worker.postMessage(payload);
  }

  function run(file: File) {
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File is ${(file.size / 1048576).toFixed(1)} MB — the free tier limit is ${MAX_MB} MB.`);
      return;
    }
    start(file);
  }

  function runText() {
    if (!raw.trim()) { setError("Paste at least one log line first."); return; }
    start(raw);
  }

  const statusData = result ? Object.entries(result.status).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const hourData = result ? Object.entries(result.hours).map(([name, value]) => ({ name: name.slice(-2) + "h", value })).slice(-48) : [];
  const topPaths = result ? Object.entries(result.paths).sort((a, b) => b[1] - a[1]).slice(0, 10) : [];
  const topIps = result ? Object.entries(result.ips).sort((a, b) => b[1] - a[1]).slice(0, 10) : [];

  return (
    <div className="space-y-4">
      <div className="glass p-5">
        <div className="mb-4 inline-flex rounded-xl border border-border bg-surface/50 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all duration-200 ${mode === "file" ? "bg-surface-2 text-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Upload className="h-3.5 w-3.5" /> Upload file
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all duration-200 ${mode === "paste" ? "bg-surface-2 text-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ClipboardType className="h-3.5 w-3.5" /> Paste raw log lines instead
          </button>
        </div>

        {mode === "file" ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center transition-colors duration-200 hover:border-[color:var(--primary)]">
            {busy ? <Loader2 className="h-6 w-6 animate-spin text-[color:var(--primary)]" /> : <Upload className="h-6 w-6 text-[color:var(--primary)]" />}
            <span className="text-sm font-semibold">{busy ? `Parsing… ${progress.toLocaleString()} lines` : "Drop an Apache / Nginx access log"}</span>
            <span className="text-xs text-muted-foreground">Combined log format · max {MAX_MB} MB · parsed in a Web Worker, never uploaded</span>
            <input ref={inputRef} type="file" accept=".log,.txt,text/plain" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) run(f); }} />
          </label>
        ) : (
          <div className="space-y-3">
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              spellCheck={false}
              rows={10}
              placeholder={'127.0.0.1 - - [26/Jul/2026:10:12:03 +0000] "GET /api/health HTTP/1.1" 200 512'}
              className="w-full resize-y rounded-xl border border-border bg-surface/40 p-4 font-mono text-xs leading-relaxed text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground/60 focus:border-[color:var(--primary)]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {raw ? `${raw.split(/\r?\n/).filter((l) => l.trim()).length.toLocaleString()} lines ready` : "Combined log format · parsed in a Web Worker, never uploaded"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setRaw(""); setResult(null); setError(""); }}
                  className="rounded-xl border border-border bg-surface/60 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={runText}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--primary)] px-5 py-2 text-xs font-semibold text-[color:var(--primary-foreground)] transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  {busy ? `Parsing… ${progress.toLocaleString()}` : "Analyze"}
                </button>
              </div>
            </div>
          </div>
        )}
        {error && <p className="mt-3 text-xs text-[color:var(--destructive)]">{error}</p>}
      </div>


      {result && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Lines parsed" value={result.total.toLocaleString()} />
            <Stat label="Unparsed" value={result.unparsed.toLocaleString()} />
            <Stat label="Bytes served" value={`${(result.bytes / 1048576).toFixed(1)} MB`} />
            <Stat label="Unique IPs" value={Object.keys(result.ips).length.toLocaleString()} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass p-5">
              <h3 className="text-sm font-semibold">HTTP status codes</h3>
              <div className="mt-3 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip contentStyle={{ background: "#f8fafc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                    <Bar dataKey="value" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass p-5">
              <h3 className="text-sm font-semibold">Requests over time</h3>
              <div className="mt-3 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip contentStyle={{ background: "#f8fafc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                    <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TopList title="Top paths" rows={topPaths} />
            <TopList title="Top clients" rows={topIps} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="glass p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 divide-y divide-border/60 text-sm">
        {rows.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between gap-4 py-2">
            <span className="truncate font-mono text-xs text-muted-foreground">{k}</span>
            <span className="shrink-0 font-semibold text-[color:var(--primary)]">{v.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
