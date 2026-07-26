import { useMemo, useState } from "react";
import { Upload, ChevronDown } from "lucide-react";

type Spec = {
  info?: { title?: string; version?: string; description?: string };
  servers?: { url: string }[];
  paths?: Record<string, Record<string, Op>>;
  components?: { securitySchemes?: Record<string, { type?: string; scheme?: string; name?: string }> };
};
type Op = {
  summary?: string; description?: string; tags?: string[];
  parameters?: { name: string; in: string; required?: boolean; schema?: { type?: string } }[];
  requestBody?: { content?: Record<string, { schema?: unknown }> };
  responses?: Record<string, { description?: string }>;
};

const SAMPLE = `{
  "openapi": "3.0.0",
  "info": { "title": "DevMatrix API", "version": "1.0.0", "description": "Smart link routing API." },
  "servers": [{ "url": "https://api.proforma.link" }],
  "paths": {
    "/links": {
      "get": { "summary": "List smart links", "tags": ["Links"], "responses": { "200": { "description": "OK" } } },
      "post": { "summary": "Create a smart link", "tags": ["Links"], "responses": { "201": { "description": "Created" } } }
    },
    "/links/{slug}": {
      "get": {
        "summary": "Resolve a slug",
        "tags": ["Links"],
        "parameters": [{ "name": "slug", "in": "path", "required": true, "schema": { "type": "string" } }],
        "responses": { "302": { "description": "Redirect" }, "404": { "description": "Not found" } }
      }
    }
  }
}`;

const METHOD_COLOR: Record<string, string> = {
  get: "text-[color:var(--primary)]",
  post: "text-[color:var(--primary)]",
  put: "text-amber-400",
  patch: "text-amber-400",
  delete: "text-[color:var(--destructive)]",
};

export default function OpenApiDocs() {
  const [raw, setRaw] = useState(SAMPLE);
  const [error, setError] = useState("");

  const spec = useMemo<Spec | null>(() => {
    try { const s = JSON.parse(raw) as Spec; setError(""); return s; }
    catch { setError("Invalid JSON specification. YAML specs must be converted to JSON first."); return null; }
  }, [raw]);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="glass p-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">OpenAPI JSON</label>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-2">
            <Upload className="h-3.5 w-3.5" /> Load file
            <input type="file" accept=".json,application/json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setRaw(await f.text()); }} />
          </label>
        </div>
        <textarea
          value={raw} onChange={(e) => setRaw(e.target.value)} rows={26} spellCheck={false}
          className="mt-2 w-full resize-y rounded-lg border border-input bg-surface p-3 font-mono text-[11px] leading-relaxed outline-none focus:border-[color:var(--primary)]"
        />
        {error && <p className="mt-2 text-xs text-[color:var(--destructive)]">{error}</p>}
      </div>

      <div className="lg:col-span-3">
        {spec && (
          <div className="glass p-6">
            <h2 className="text-2xl font-semibold tracking-tight">{spec.info?.title ?? "API"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">v{spec.info?.version ?? "1.0.0"} · {spec.servers?.[0]?.url ?? "no server declared"}</p>
            {spec.info?.description && <p className="mt-3 text-sm text-muted-foreground">{spec.info.description}</p>}

            <div className="mt-6 space-y-3">
              {Object.entries(spec.paths ?? {}).flatMap(([path, ops]) =>
                Object.entries(ops).map(([method, op]) => (
                  <Endpoint key={`${method}-${path}`} path={path} method={method} op={op} />
                )),
              )}
            </div>

            {spec.components?.securitySchemes && (
              <div className="mt-6 rounded-xl border border-border bg-surface/40 p-4">
                <h3 className="text-sm font-semibold">Security schemes</h3>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {Object.entries(spec.components.securitySchemes).map(([k, v]) => (
                    <li key={k}><span className="font-mono text-[color:var(--primary)]">{k}</span> — {v.type} {v.scheme ?? ""}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Endpoint({ path, method, op }: { path: string; method: string; op: Op }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface">
        <span className={`w-16 shrink-0 font-mono text-xs font-bold uppercase ${METHOD_COLOR[method] ?? "text-muted-foreground"}`}>{method}</span>
        <span className="min-w-0 flex-1 truncate font-mono text-sm">{path}</span>
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{op.summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border/60 px-4 py-4 text-sm">
          {op.description && <p className="text-xs text-muted-foreground">{op.description}</p>}
          {op.parameters?.length ? (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--primary)]">Parameters</h4>
              <div className="mt-2 space-y-2">
                {op.parameters.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 font-mono text-xs">{p.name}<span className="text-muted-foreground"> ({p.in})</span></span>
                    <input
                      value={values[p.name] ?? ""} placeholder={p.schema?.type ?? "string"}
                      onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
                      className="input flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--primary)]">Responses</h4>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {Object.entries(op.responses ?? {}).map(([code, r]) => (
                <li key={code}><span className="font-mono text-foreground">{code}</span> — {r.description}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-surface p-3 font-mono text-[11px] text-muted-foreground">
            {method.toUpperCase()} {path.replace(/\{(\w+)\}/g, (_, k) => values[k] || `{${k}}`)}
          </div>
        </div>
      )}
    </div>
  );
}
