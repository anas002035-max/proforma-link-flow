import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";

function decodeEscapes(src: string) {
  return src
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function normalizeMembers(src: string) {
  // obj["prop"] -> obj.prop when the key is a valid identifier
  return src.replace(/\[\s*(['"])([A-Za-z_$][\w$]*)\1\s*\]/g, ".$2");
}

function beautify(src: string) {
  let out = "";
  let indent = 0;
  let inStr: string | null = null;
  const pad = () => "  ".repeat(Math.max(indent, 0));

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const prev = src[i - 1];
    if (inStr) {
      out += c;
      if (c === inStr && prev !== "\\") inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inStr = c; out += c; continue; }
    if (c === "{" || c === "[") { indent++; out += c + "\n" + pad(); continue; }
    if (c === "}" || c === "]") { indent--; out = out.replace(/\s+$/, "") + "\n" + pad() + c; continue; }
    if (c === ";") { out += ";\n" + pad(); continue; }
    if (c === ",") { out += ",\n" + pad(); continue; }
    if (c === "\n" || c === "\t") continue;
    if (c === " " && /\s$/.test(out)) continue;
    out += c;
  }
  return out.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l, idx, arr) => !(l === "" && arr[idx - 1] === "")).join("\n");
}

export function deobfuscate(src: string) {
  let code = decodeEscapes(src.trim());
  code = normalizeMembers(code);
  code = code.replace(/;\s*}/g, ";}");
  return beautify(code);
}

const SAMPLE = `var _0x1a=['\\x68\\x65\\x6c\\x6c\\x6f','\\x77\\x6f\\x72\\x6c\\x64'];function a(b){if(b['length']>0){return _0x1a[0]+' '+_0x1a[1];}else{return null;}}`;

export default function JsDeobfuscator() {
  const [input, setInput] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);
  const output = useMemo(() => { try { return deobfuscate(input); } catch { return "// Failed to parse input"; } }, [input]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass p-5">
        <label className="text-xs font-medium text-muted-foreground">Obfuscated / minified JavaScript</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={20}
          spellCheck={false}
          className="mt-2 w-full resize-y rounded-lg border border-input bg-surface p-3 font-mono text-xs leading-relaxed outline-none focus:border-[color:var(--neon-blue)]"
        />
        <p className="mt-2 text-[11px] text-muted-foreground">Passes: hex/unicode escape decoding → bracket member normalisation → re-indentation.</p>
      </div>
      <div className="glass p-5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Readable output</label>
          <button
            onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-2"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[color:var(--neon-green)]" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="mt-2 h-[30rem] overflow-auto rounded-lg bg-surface p-3 font-mono text-xs leading-relaxed">{output}</pre>
      </div>
    </div>
  );
}
