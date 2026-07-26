import { useMemo, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";

function b64urlDecode(part: string): string {
  const pad = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = pad + "=".repeat((4 - (pad.length % 4)) % 4);
  const bin = atob(padded);
  try {
    return decodeURIComponent(
      Array.from(bin).map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""),
    );
  } catch {
    return bin;
  }
}

const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlByb2Zvcm1hIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export default function JwtInspector() {
  const [token, setToken] = useState(SAMPLE);

  const result = useMemo<
    | null
    | { error: string; header?: undefined; payload?: undefined; issues?: undefined; alg?: undefined }
    | { error?: undefined; header: Record<string, unknown>; payload: Record<string, unknown>; issues: string[]; alg: string }
  >(() => {
    const raw = token.trim().replace(/^Bearer\s+/i, "");
    if (!raw) return null;
    const parts = raw.split(".");
    if (parts.length < 2) return { error: "Not a JWT — expected at least two dot-separated segments." };
    try {
      const header = JSON.parse(b64urlDecode(parts[0]));
      const payload = JSON.parse(b64urlDecode(parts[1]));
      const alg = String(header.alg ?? "").toLowerCase();
      const issues: string[] = [];
      if (alg === "none" || alg === "") issues.push("Algorithm is 'none' — the signature is not verified. Critical risk.");
      if (!parts[2]) issues.push("Signature segment is missing or empty.");
      if (alg.startsWith("hs") && alg !== "hs256" && alg !== "hs384" && alg !== "hs512") issues.push(`Unusual HMAC variant: ${alg}.`);
      if (payload.exp && Number(payload.exp) * 1000 < Date.now()) issues.push("Token is expired (exp is in the past).");
      if (!payload.exp) issues.push("No exp claim — the token never expires.");
      return { header, payload, issues, alg };
    } catch {
      return { error: "Could not base64-decode the token segments." };
    }
  }, [token]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass p-5">
        <label className="text-xs font-medium text-muted-foreground">Encoded token</label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={10}
          spellCheck={false}
          className="mt-2 w-full resize-y rounded-lg border border-input bg-surface p-3 font-mono text-xs leading-relaxed outline-none focus:border-[color:var(--neon-blue)]"
        />
        {result?.issues && (
          <div className={`mt-4 rounded-xl border p-4 text-sm ${result.issues.length ? "border-[color:var(--destructive)]/40 bg-[color:var(--destructive)]/10" : "border-[color:var(--neon-green)]/40 bg-[color:var(--neon-green)]/10"}`}>
            <div className="flex items-center gap-2 font-semibold">
              {result.issues.length
                ? <><ShieldAlert className="h-4 w-4 text-[color:var(--destructive)]" /> {result.issues.length} security finding(s)</>
                : <><ShieldCheck className="h-4 w-4 text-[color:var(--neon-green)]" /> No structural issues detected</>}
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {result.issues.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {result?.error && (
          <div className="glass p-5 text-sm text-[color:var(--destructive)]">{result.error}</div>
        )}
        {result?.header && (
          <>
            <Pane title="Header" data={result.header} />
            <Pane title="Payload" data={result.payload} />
          </>
        )}
      </div>
    </div>
  );
}

function Pane({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="glass p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--neon-blue)]">{title}</h3>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-xs leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
