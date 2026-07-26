import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

type LogRow = { country: string | null; device_type: string | null; os: string | null; timestamp: string };

const NEON = ["#22d3ee", "#a3ff5b", "#f472b6", "#facc15", "#a78bfa", "#38bdf8", "#4ade80", "#fb923c"];

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  DE: "Germany", FR: "France", ES: "Spain", IT: "Italy", NL: "Netherlands",
  BR: "Brazil", MX: "Mexico", JP: "Japan", KR: "South Korea", CN: "China",
  IN: "India", SG: "Singapore", AE: "UAE", SA: "Saudi Arabia", EG: "Egypt",
  ZA: "South Africa", NG: "Nigeria", TR: "Turkey",
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function TrafficLineChart({ logs, days = 14 }: { logs: LogRow[]; days?: number }) {
  const data = useMemo(() => {
    const buckets = new Map<string, number>();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      buckets.set(dayKey(d), 0);
    }
    for (const l of logs) {
      const k = dayKey(new Date(l.timestamp));
      if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
    }
    return [...buckets.entries()].map(([date, clicks]) => ({
      date: date.slice(5), clicks,
    }));
  }, [logs, days]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a3ff5b" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={11} />
          <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "#f8fafc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="clicks" stroke="url(#lg)" strokeWidth={2.5} dot={{ fill: "#22d3ee", r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function bucket(logs: LogRow[], key: "country" | "device_type" | "os", label = (v: string) => v) {
  const m = new Map<string, number>();
  for (const l of logs) {
    const v = (l[key] || "Unknown") as string;
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v]) => ({ name: label(k), value: v }));
}

export function BreakdownPie({ logs, kind, title }: {
  logs: LogRow[]; kind: "country" | "device_type" | "os"; title: string;
}) {
  const data = useMemo(() => {
    if (kind === "country") return bucket(logs, "country", (c) => COUNTRY_NAMES[c] || c);
    return bucket(logs, kind);
  }, [logs, kind]);

  return (
    <div className="glass p-5">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      {data.length === 0 ? (
        <div className="mt-6 grid h-48 place-items-center text-xs text-muted-foreground">No data yet</div>
      ) : (
        <div className="mt-2 h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={72} paddingAngle={2}>
                {data.map((_, i) => <Cell key={i} fill={NEON[i % NEON.length]} stroke="rgba(11,15,25,0.8)" />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#f8fafc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
