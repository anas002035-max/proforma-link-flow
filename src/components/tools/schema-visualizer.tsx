import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Copy, Check, Wand2, AlertTriangle } from "lucide-react";

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
  const [source, setSource] = useState<"canvas" | "sql">("canvas");
  const [sql, setSql] = useState("");
  const [sqlError, setSqlError] = useState("");
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const ddl = useMemo(() => compile(tables, relations, dialect), [tables, relations, dialect]);

  useEffect(() => {
    if (source === "canvas") setSql(ddl);
  }, [ddl, source]);

  function onSqlChange(text: string) {
    setSource("sql");
    setSql(text);
    const parsed = parseSql(text, tables);
    if (!parsed) {
      setSqlError("No CREATE TABLE statement found — the canvas keeps its current shape.");
      return;
    }
    setSqlError("");
    setTables(parsed.tables);
    setRelations(parsed.relations);
  }


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
            className="absolute w-56 rounded-xl border border-border bg-surface-2/95 shadow-[var(--shadow-soft)] backdrop-blur"
            style={{ left: t.x, top: t.y }}
          >
            <div
              onMouseDown={(e) => {
                const box = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                drag.current = { id: t.id, dx: e.clientX - box.left, dy: e.clientY - box.top };
              }}
              className="flex cursor-grab items-center justify-between rounded-t-xl bg-[color:var(--primary)] px-3 py-2 text-xs font-bold text-[color:var(--primary-foreground)] active:cursor-grabbing"
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
                    className={`rounded px-1 text-[10px] font-bold ${c.pk ? "text-[color:var(--primary)]" : "text-muted-foreground"}`}
                  >PK</button>
                  <button onClick={() => setTables((p) => p.map((x) => x.id === t.id ? { ...x, columns: x.columns.filter((_, j) => j !== i) } : x))} className="text-muted-foreground hover:text-[color:var(--destructive)]">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setTables((p) => p.map((x) => x.id === t.id ? { ...x, columns: [...x.columns, { name: "column", type: "text", pk: false, nullable: true }] } : x))}
                className="mt-1 inline-flex items-center gap-1 text-[11px] text-[color:var(--primary)]"
              >
                <Plus className="h-3 w-3" /> column
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => setTables((p) => [...p, { id: uid(), name: `table_${p.length + 1}`, x: 60 + p.length * 24, y: 60 + p.length * 24, columns: [{ name: "id", type: "uuid", pk: true, nullable: false }] }])}
          className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--primary)] px-3 py-2 text-xs font-semibold text-[color:var(--primary-foreground)]"
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
                <span className="text-[color:var(--primary)]">→</span>
                <Select value={r.to} onChange={(v) => setRelations((p) => p.map((x) => x.id === r.id ? { ...x, to: v } : x))} options={tables.map((t) => [t.id, t.name])} />
                <input value={r.toCol} onChange={(e) => setRelations((p) => p.map((x) => x.id === r.id ? { ...x, toCol: e.target.value } : x))} className="w-16 rounded bg-surface px-1.5 py-1 outline-none" />
                <button onClick={() => setRelations((p) => p.filter((x) => x.id !== r.id))} className="ml-auto text-muted-foreground hover:text-[color:var(--destructive)]"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <button
              onClick={() => tables[1] && setRelations((p) => [...p, { id: uid(), from: tables[1].id, fromCol: "id", to: tables[0].id, toCol: "id", kind: "1-n" }])}
              className="inline-flex items-center gap-1 text-xs text-[color:var(--primary)]"
            ><Plus className="h-3.5 w-3.5" /> Add relation</button>
          </div>
        </div>

        <div className="glass p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Migration SQL <span className="font-normal text-muted-foreground">(editable)</span></h3>
            <div className="flex items-center gap-2">
              <select value={dialect} onChange={(e) => { setDialect(e.target.value as "postgres" | "mysql"); setSource("canvas"); }} className="rounded-lg border border-input bg-surface px-2 py-1 text-xs outline-none [&>option]:bg-[color:var(--popover)]">
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
              </select>
              <button onClick={() => { setSource("canvas"); setSqlError(""); setSql(ddl); }} title="Regenerate from canvas" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold hover:bg-surface-2">
                <Wand2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => { navigator.clipboard.writeText(sql); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold hover:bg-surface-2">
                {copied ? <Check className="h-3.5 w-3.5 text-[color:var(--primary)]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Paste any PostgreSQL/MySQL DDL — the canvas re-draws tables and foreign-key lines as you type.</p>
          <textarea
            value={sql}
            spellCheck={false}
            rows={16}
            onChange={(e) => onSqlChange(e.target.value)}
            className="mt-3 w-full resize-y rounded-lg border border-input bg-surface p-3 font-mono text-[11px] leading-relaxed outline-none focus:border-[color:var(--primary)]"
          />
          {sqlError && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[color:var(--destructive)]">
              <AlertTriangle className="h-3.5 w-3.5" /> {sqlError}
            </p>
          )}
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

const TYPE_ALIASES: [RegExp, string][] = [
  [/^uuid|^char\(36\)/i, "uuid"],
  [/^(text|varchar|character|string|nvarchar|citext)/i, "text"],
  [/^(bigint|bigserial|int8)/i, "bigint"],
  [/^(smallint|integer|int|serial|int4|mediumint|tinyint\(1\))/i, "integer"],
  [/^(bool)/i, "boolean"],
  [/^(numeric|decimal|real|double|float|money)/i, "numeric"],
  [/^(jsonb|json)/i, "jsonb"],
  [/^(timestamptz|timestamp|datetime)/i, "timestamptz"],
  [/^date/i, "date"],
];

function normalizeType(raw: string) {
  const t = raw.trim();
  if (/^tinyint\s*\(\s*1\s*\)/i.test(t)) return "boolean";
  for (const [re, out] of TYPE_ALIASES) if (re.test(t)) return out;
  return "text";
}

function splitTopLevel(body: string) {
  const parts: string[] = [];
  let depth = 0, current = "", quote = "";
  for (const ch of body) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; current += ch; continue; }
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { parts.push(current); current = ""; continue; }
    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

const clean = (s: string) => s.replace(/["`\[\]]/g, "").replace(/^[\w]+\./, "").trim();

/** Parse raw DDL into canvas tables + relations. Returns null when nothing parseable is found. */
function parseSql(sqlText: string, previous: Table[]): { tables: Table[]; relations: Relation[] } | null {
  const text = sqlText.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"\[\]\w.]+)\s*\(/gi;
  const parsedTables: Table[] = [];
  type PendingFk = { fromTable: string; fromCol: string; toTable: string; toCol: string };
  const pending: PendingFk[] = [];

  let m: RegExpExecArray | null;
  let index = 0;
  while ((m = re.exec(text))) {
    const start = m.index + m[0].length;
    let depth = 1, i = start;
    while (i < text.length && depth > 0) {
      if (text[i] === "(") depth++;
      else if (text[i] === ")") depth--;
      i++;
    }
    if (depth !== 0) continue;
    const body = text.slice(start, i - 1);
    const name = clean(m[1]);
    const prior = previous.find((p) => p.name === name);
    const table: Table = {
      id: prior?.id ?? uid(),
      name,
      x: prior?.x ?? 40 + (index % 3) * 250,
      y: prior?.y ?? 40 + Math.floor(index / 3) * 220,
      columns: [],
    };
    const pkNames = new Set<string>();

    for (const part of splitTopLevel(body)) {
      const fkMatch = part.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([`"\[\]\w.]+)\s*\(([^)]+)\)/i);
      if (fkMatch) {
        pending.push({ fromTable: name, fromCol: clean(fkMatch[1]), toTable: clean(fkMatch[2]), toCol: clean(fkMatch[3]) });
        continue;
      }
      const pkMatch = part.match(/^(?:CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        pkMatch[1].split(",").forEach((c) => pkNames.add(clean(c)));
        continue;
      }
      if (/^(CONSTRAINT|UNIQUE|CHECK|INDEX|KEY|EXCLUDE)\b/i.test(part)) continue;

      const colMatch = part.match(/^([`"\[\]\w]+)\s+([\w]+(?:\s*\([^)]*\))?(?:\s+(?:WITH|WITHOUT)\s+TIME\s+ZONE)?)/i);
      if (!colMatch) continue;
      const colName = clean(colMatch[1]);
      const inlineFk = part.match(/REFERENCES\s+([`"\[\]\w.]+)\s*\(([^)]+)\)/i);
      if (inlineFk) pending.push({ fromTable: name, fromCol: colName, toTable: clean(inlineFk[1]), toCol: clean(inlineFk[2]) });
      table.columns.push({
        name: colName,
        type: normalizeType(colMatch[2]),
        pk: /PRIMARY\s+KEY/i.test(part),
        nullable: !/NOT\s+NULL/i.test(part) && !/PRIMARY\s+KEY/i.test(part),
      });
    }

    table.columns = table.columns.map((c) => (pkNames.has(c.name) ? { ...c, pk: true, nullable: false } : c));
    parsedTables.push(table);
    index++;
  }

  if (!parsedTables.length) return null;

  const relations: Relation[] = pending.flatMap((p) => {
    const from = parsedTables.find((t) => t.name === p.fromTable);
    const to = parsedTables.find((t) => t.name === p.toTable);
    if (!from || !to) return [];
    return [{ id: uid(), from: from.id, fromCol: p.fromCol, to: to.id, toCol: p.toCol, kind: "1-n" as const }];
  });

  return { tables: parsedTables, relations };
}
