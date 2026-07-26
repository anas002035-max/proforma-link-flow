import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

const WORKER_SRC = `
const LINE = /^(\\S+) \\S+ \\S+ \\[([^\\]]+)\\] "(\\S+) (\\S+)[^"]*" (\\d{3}) (\\d+|-)/;
self.onmessage = async (e) => {
  const file = e.data;
  const status = {}, paths = {}, hours = {}, ips = {};
  let total = 0, bytes = 0, unparsed = 0;
  const stream = file.stream().pipeThrough(new TextDecoderStream());
  const reader = stream.getReader();
  let carry = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = carry + value;
    const lines = chunk.split("\\n");
    carry = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      total++;
      const m = LINE.exec(line);
      if (!m) { unparsed++; continue; }
      const [, ip, ts, , path, code, size] = m;
      status[code] = (status[code] || 0) + 1;
      paths[path] = (paths[path] || 0) + 1;
      ips[ip] = (ips[ip] || 0) + 1;
      const hour = ts.slice(0, 14);
      hours[hour] = (hours[hour] || 0) + 1;
      if (size !== "-") bytes += Number(size);
      if (total % 20000 === 0) self.postMessage({ type: "progress", total });
    }
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
  const inputRef = useRef<HTMLInputElement>(null);

  function run(file: File) {
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File is ${(file.size / 1048576).toFixed(1)} MB — the free tier limit is ${MAX_MB} MB.`);
      return;
    }
    setError(""); setBusy(true); setProgress(0); setResult(null);
    const worker = new Worker(URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" })));
    worker.onmessage = (e) => {
      if (e.data.type === "progress") setProgress(e.data.total);
      if (e.data.type === "done") { setResult(e.data.result); setBusy(false); worker.terminate(); }
    };
    worker.onerror = () => { setError("Worker failed to parse this file."); setBusy(false); worker.terminate(); };
    worker.postMessage(file);
  }

  const statusData = result ? Object.entries(result.status).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const hourData = result ? Object.entries(result.hours).map(([name, value]) => ({ name: name.slice(-2) + "h", value })).slice(-48) : [];
  const topPaths = result ? Object.entries(result.paths).sort((a, b) => b[1] - a[1]).slice(0, 10) : [];
  const topIps = result ? Object.entries(result.ips).sort((a, b) => b[1] - a[1]).slice(0, 10) : [];

  return (
    <div className="space-y-4">
      <div className="glass p-5">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center hover:border-[color:var(--neon-blue)]">
          {busy ? <Loader2 className="h-6 w-6 animate-spin text-[color:var(--neon-blue)]" /> : <Upload className="h-6 w-6 text-[color:var(--neon-blue)]" />}
          <span className="text-sm font-semibold">{busy ? `Parsing… ${progress.toLocaleString()} lines` : "Drop an Apache / Nginx access log"}</span>
          <span className="text-xs text-muted-foreground">Combined log format · max {MAX_MB} MB · parsed in a Web Worker, never uploaded</span>
          <input ref={inputRef} type="file" accept=".log,.txt,text/plain" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) run(f); }} />
        </label>
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
                    <Tooltip contentStyle={{ background: "#0B0F19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
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
                    <Tooltip contentStyle={{ background: "#0B0F19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
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
      <div className="mt-2 text-2xl font-black">{value}</div>
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
            <span className="shrink-0 font-semibold text-[color:var(--neon-blue)]">{v.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
