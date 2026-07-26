import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Copy, Check } from "lucide-react";

type Column = { name: string; type: string; pk: boolean; nullable: boolean };
type Table = { id: string; name: string; x: number; y: number; columns: Column[] };
type Relation = { id: string; from: string; fromCol: string; to: string; toCol: string; kind: "1-n" | "n-n" };

const uid = () => Math.random().toString(36).slice(2, 9);

const INITIAL: Table[] = [
  { id: "t1", name: "users", x: 40, y: 40, columns: [
    { name: "id", type: "uuid", pk: true, nullable: false },
    { name: "email", type: "text", pk: false, nullable: false },
  ] },
  { id: "t2", name: "posts", x: 360, y: 160, columns: [
    { name: "id", type: "uuid", pk: true, nullable: false },
    { name: "user_id", type: "uuid", pk: false, nullable: false },
    { name: "title", type: "text", pk: false, nullable: false },
  ] },
];

const TYPES = ["uuid", "text", "integer", "bigint", "boolean", "numeric", "jsonb", "timestamptz", "date"];

export default function SchemaVisualizer() {
  const [tables, setTables] = useState<Table[]>(INITIAL);
  const [relations, setRelations] = useState<Relation[]>([
    { id: "r1", from: "t2", fromCol: "user_id", to: "t1", toCol: "id", kind: "1-n" },
  ]);
  const [dialect, setDialect] = useState<"postgres" | "mysql">("postgres");
  const [copied, setCopied] = useState(false);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const ddl = useMemo(() => compile(tables, relations, dialect), [tables, relations, dialect]);

  function onMove(e: React.MouseEvent) {
    if (!drag.current) return;
    const { id, dx, dy } = drag.current;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - dx);
    const y = Math.max(0, e.clientY - rect.top - dy);
    setTables((p) => p.map((t) => (t.id === id ? { ...t, x, y } : t)));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div
        className="glass relative h-[520px] overflow-hidden lg:col-span-3"
        onMouseMove={onMove}
        onMouseUp={() => (drag.current = null)}
        onMouseLeave={() => (drag.current = null)}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {relations.map((r) => {
            const a = tables.find((t) => t.id === r.from);
            const b = tables.find((t) => t.id === r.to);
            if (!a || !b) return null;
            return <line key={r.id} x1={a.x + 110} y1={a.y + 30} x2={b.x + 110} y2={b.y + 30} stroke="#38bdf8" strokeWidth={2} strokeDasharray="6 4" />;
          })}
        </svg>
        {tables.map((t) => (
          <div
            key={t.id}
            className="absolute w-56 rounded-xl border border-border bg-surface-2/95 shadow-[var(--glow-blue)] backdrop-blur"
            style={{ left: t.x, top: t.y }}
          >
            <div
              onMouseDown={(e) => {
                const box = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                drag.current = { id: t.id, dx: e.clientX - box.left, dy: e.clientY - box.top };
              }}
              className="flex cursor-grab items-center justify-between rounded-t-xl bg-[image:var(--gradient-neon)] px-3 py-2 text-xs font-bold text-[color:var(--primary-foreground)] active:cursor-grabbing"
            >
              <input
                value={t.name}
                onChange={(e) => setTables((p) => p.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))}
                className="w-full bg-transparent outline-none"
              />
              <button onClick={() => { setTables((p) => p.filter((x) => x.id !== t.id)); setRelations((p) => p.filter((r) => r.from !== t.id && r.to !== t.id)); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1 p-2">
              {t.columns.map((c, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    value={c.name}
                    onChange={(e) => setTables((p) => p.map((x) => x.id === t.id ? { ...x, columns: x.columns.map((y, j) => j === i ? { ...y, name: e.target.value } : y) } : x))}
                    className="w-20 rounded bg-surface px-1.5 py-1 text-[11px] outline-none"
                  />
                  <select
                    value={c.type}
                    onChange={(e) => setTables((p) => p.map((x) => x.id === t.id ? { ...x, columns: x.columns.map((y, j) => j === i ? { ...y, type: e.target.value } : y) } : x))}
                    className="flex-1 rounded bg-surface px-1 py-1 text-[11px] outline-none [&>option]:bg-[color:var(--popover)]"
                  >
                    {TYPES.map((ty) => <option key={ty}>{ty}</option>)}
                  </select>
                  <button
                    onClick={() => setTables((p) => p.map((x) => x.id === t.id ? { ...x, columns: x.columns.map((y, j) => j === i ? { ...y, pk: !y.pk } : y) } : x))}
                    className={`rounded px-1 text-[10px] font-bold ${c.pk ? "text-[color:var(--neon-green)]" : "text-muted-foreground"}`}
                  >PK</button>
                  <button onClick={() => setTables((p) => p.map((x) => x.id === t.id ? { ...x, columns: x.columns.filter((_, j) => j !== i) } : x))} className="text-muted-foreground hover:text-[color:var(--destructive)]">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setTables((p) => p.map((x) => x.id === t.id ? { ...x, columns: [...x.columns, { name: "column", type: "text", pk: false, nullable: true }] } : x))}
                className="mt-1 inline-flex items-center gap-1 text-[11px] text-[color:var(--neon-blue)]"
              >
                <Plus className="h-3 w-3" /> column
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => setTables((p) => [...p, { id: uid(), name: `table_${p.length + 1}`, x: 60 + p.length * 24, y: 60 + p.length * 24, columns: [{ name: "id", type: "uuid", pk: true, nullable: false }] }])}
          className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-xl bg-[image:var(--gradient-neon)] px-3 py-2 text-xs font-semibold text-[color:var(--primary-foreground)]"
        >
          <Plus className="h-3.5 w-3.5" /> Add table
        </button>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="glass p-5">
          <h3 className="text-sm font-semibold">Relations</h3>
          <div className="mt-3 space-y-2">
            {relations.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface/40 p-2 text-[11px]">
                <Select value={r.from} onChange={(v) => setRelations((p) => p.map((x) => x.id === r.id ? { ...x, from: v } : x))} options={tables.map((t) => [t.id, t.name])} />
                <input value={r.fromCol} onChange={(e) => setRelations((p) => p.map((x) => x.id === r.id ? { ...x, fromCol: e.target.value } : x))} className="w-16 rounded bg-surface px-1.5 py-1 outline-none" />
                <span className="text-[color:var(--neon-blue)]">→</span>
                <Select value={r.to} onChange={(v) => setRelations((p) => p.map((x) => x.id === r.id ? { ...x, to: v } : x))} options={tables.map((t) => [t.id, t.name])} />
                <input value={r.toCol} onChange={(e) => setRelations((p) => p.map((x) => x.id === r.id ? { ...x, toCol: e.target.value } : x))} className="w-16 rounded bg-surface px-1.5 py-1 outline-none" />
                <button onClick={() => setRelations((p) => p.filter((x) => x.id !== r.id))} className="ml-auto text-muted-foreground hover:text-[color:var(--destructive)]"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <button
              onClick={() => tables[1] && setRelations((p) => [...p, { id: uid(), from: tables[1].id, fromCol: "id", to: tables[0].id, toCol: "id", kind: "1-n" }])}
              className="inline-flex items-center gap-1 text-xs text-[color:var(--neon-blue)]"
            ><Plus className="h-3.5 w-3.5" /> Add relation</button>
          </div>
        </div>

        <div className="glass p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Migration output</h3>
            <div className="flex items-center gap-2">
              <select value={dialect} onChange={(e) => setDialect(e.target.value as "postgres" | "mysql")} className="rounded-lg border border-input bg-surface px-2 py-1 text-xs outline-none [&>option]:bg-[color:var(--popover)]">
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
              </select>
              <button onClick={() => { navigator.clipboard.writeText(ddl); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold hover:bg-surface-2">
                {copied ? <Check className="h-3.5 w-3.5 text-[color:var(--neon-green)]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-surface p-3 font-mono text-[11px] leading-relaxed">{ddl}</pre>
        </div>
      </div>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded bg-surface px-1.5 py-1 outline-none [&>option]:bg-[color:var(--popover)]">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function compile(tables: Table[], relations: Relation[], dialect: "postgres" | "mysql") {
  const map = (t: string) => dialect === "mysql"
    ? ({ uuid: "CHAR(36)", text: "TEXT", integer: "INT", bigint: "BIGINT", boolean: "TINYINT(1)", numeric: "DECIMAL(12,2)", jsonb: "JSON", timestamptz: "DATETIME", date: "DATE" }[t] ?? "TEXT")
    : t.toUpperCase();

  return tables.map((t) => {
    const cols = t.columns.map((c) => `  ${c.name} ${map(c.type)}${c.pk ? " PRIMARY KEY" : c.nullable ? "" : " NOT NULL"}`);
    const fks = relations.filter((r) => r.from === t.id).map((r) => {
      const target = tables.find((x) => x.id === r.to);
      return target ? `  FOREIGN KEY (${r.fromCol}) REFERENCES ${target.name}(${r.toCol}) ON DELETE CASCADE` : null;
    }).filter(Boolean);
    return `CREATE TABLE ${t.name} (\n${[...cols, ...fks].join(",\n")}\n);`;
  }).join("\n\n");
}
