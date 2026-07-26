import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";

type ServiceId = "node" | "postgres" | "redis" | "nginx" | "mongo" | "worker";

type Service = {
  id: ServiceId; label: string; image: string; port: string; env: string;
};

const CATALOG: Service[] = [
  { id: "node", label: "Node.js API", image: "node:22-alpine", port: "3000:3000", env: "NODE_ENV=production" },
  { id: "postgres", label: "PostgreSQL", image: "postgres:16-alpine", port: "5432:5432", env: "POSTGRES_PASSWORD=postgres\nPOSTGRES_DB=app" },
  { id: "redis", label: "Redis", image: "redis:7-alpine", port: "6379:6379", env: "" },
  { id: "nginx", label: "Nginx", image: "nginx:1.27-alpine", port: "80:80", env: "" },
  { id: "mongo", label: "MongoDB", image: "mongo:7", port: "27017:27017", env: "MONGO_INITDB_ROOT_USERNAME=root" },
  { id: "worker", label: "Background Worker", image: "node:22-alpine", port: "", env: "QUEUE=default" },
];

function compose(active: Service[]) {
  if (!active.length) return "# Select at least one service block";
  const body = active.map((s) => {
    const lines = [`  ${s.id}:`, `    image: ${s.image}`, `    restart: unless-stopped`];
    if (s.port) lines.push(`    ports:`, `      - "${s.port}"`);
    const env = s.env.split("\n").map((e) => e.trim()).filter(Boolean);
    if (env.length) { lines.push(`    environment:`); env.forEach((e) => lines.push(`      - ${e}`)); }
    if (s.id === "node" || s.id === "worker") {
      lines.push(`    build:`, `      context: .`, `      dockerfile: Dockerfile`);
      const deps = active.filter((a) => a.id === "postgres" || a.id === "redis").map((a) => a.id);
      if (deps.length) { lines.push(`    depends_on:`); deps.forEach((d) => lines.push(`      - ${d}`)); }
    }
    if (s.id === "postgres") lines.push(`    volumes:`, `      - pgdata:/var/lib/postgresql/data`);
    return lines.join("\n");
  }).join("\n\n");

  const volumes = active.some((s) => s.id === "postgres") ? `\n\nvolumes:\n  pgdata:` : "";
  return `services:\n${body}${volumes}\n`;
}

function dockerfile(active: Service[], nodeVersion: string) {
  if (!active.some((s) => s.id === "node" || s.id === "worker")) {
    return "# Add the Node.js API or Worker block to generate a Dockerfile";
  }
  return `FROM node:${nodeVersion}-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:${nodeVersion}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER node
CMD ["node", "server.js"]
`;
}

export default function DockerArchitect() {
  const [selected, setSelected] = useState<ServiceId[]>(["node", "postgres"]);
  const [config, setConfig] = useState<Record<string, Service>>(
    Object.fromEntries(CATALOG.map((c) => [c.id, c])) as Record<string, Service>,
  );
  const [nodeVersion, setNodeVersion] = useState("22");

  const active = useMemo(() => selected.map((id) => config[id]), [selected, config]);
  const yml = useMemo(() => compose(active), [active]);
  const df = useMemo(() => dockerfile(active, nodeVersion), [active, nodeVersion]);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="glass space-y-4 p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold">Service blocks</h3>
        <div className="grid grid-cols-2 gap-2">
          {CATALOG.map((s) => {
            const on = selected.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setSelected((p) => on ? p.filter((x) => x !== s.id) : [...p, s.id])}
                className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${on ? "border-[color:var(--neon-green)] bg-[color:var(--neon-green)]/10 text-[color:var(--neon-green)]" : "border-border bg-surface/40 text-muted-foreground hover:bg-surface"}`}
              >
                {s.label}
                <span className="mt-0.5 block font-mono text-[10px] font-normal opacity-70">{s.image}</span>
              </button>
            );
          })}
        </div>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Node version</span>
          <input value={nodeVersion} onChange={(e) => setNodeVersion(e.target.value)} className="input mt-1" />
        </label>

        {active.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-surface/40 p-3">
            <div className="text-xs font-semibold">{s.label}</div>
            <label className="mt-2 block">
              <span className="text-[11px] text-muted-foreground">Ports</span>
              <input value={s.port} onChange={(e) => setConfig((p) => ({ ...p, [s.id]: { ...p[s.id], port: e.target.value } }))} className="input mt-1" />
            </label>
            <label className="mt-2 block">
              <span className="text-[11px] text-muted-foreground">Environment (one per line)</span>
              <textarea rows={2} value={s.env} onChange={(e) => setConfig((p) => ({ ...p, [s.id]: { ...p[s.id], env: e.target.value } }))} className="mt-1 w-full resize-y rounded-lg border border-input bg-surface p-2 font-mono text-[11px] outline-none focus:border-[color:var(--neon-blue)]" />
            </label>
          </div>
        ))}
      </div>

      <div className="space-y-4 lg:col-span-3">
        <CodePane title="docker-compose.yml" code={yml} />
        <CodePane title="Dockerfile" code={df} />
      </div>
    </div>
  );
}

function CodePane({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-2">
          {copied ? <Check className="h-3.5 w-3.5 text-[color:var(--neon-green)]" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-surface p-3 font-mono text-[11px] leading-relaxed">{code}</pre>
    </div>
  );
}
