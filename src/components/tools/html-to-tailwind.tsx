import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";

const SPACING: Record<string, string> = {
  "0": "0", "1px": "px", "2px": "0.5", "4px": "1", "6px": "1.5", "8px": "2", "10px": "2.5",
  "12px": "3", "14px": "3.5", "16px": "4", "20px": "5", "24px": "6", "32px": "8", "40px": "10", "48px": "12", "64px": "16",
};

const DIRECT: Record<string, string> = {
  "display:flex": "flex",
  "display:grid": "grid",
  "display:block": "block",
  "display:inline-block": "inline-block",
  "display:none": "hidden",
  "flex-direction:column": "flex-col",
  "flex-direction:row": "flex-row",
  "justify-content:center": "justify-center",
  "justify-content:space-between": "justify-between",
  "justify-content:flex-end": "justify-end",
  "align-items:center": "items-center",
  "align-items:flex-start": "items-start",
  "text-align:center": "text-center",
  "text-align:right": "text-right",
  "font-weight:bold": "font-bold",
  "font-weight:700": "font-bold",
  "font-weight:600": "font-semibold",
  "font-weight:500": "font-medium",
  "font-style:italic": "italic",
  "text-transform:uppercase": "uppercase",
  "text-decoration:underline": "underline",
  "position:absolute": "absolute",
  "position:relative": "relative",
  "position:fixed": "fixed",
  "overflow:hidden": "overflow-hidden",
  "cursor:pointer": "cursor-pointer",
  "width:100%": "w-full",
  "height:100%": "h-full",
  "border-radius:9999px": "rounded-full",
  "border-radius:50%": "rounded-full",
};

const PREFIXED: [RegExp, (v: string) => string | null][] = [
  [/^margin$/, (v) => sp("m", v)],
  [/^margin-top$/, (v) => sp("mt", v)],
  [/^margin-bottom$/, (v) => sp("mb", v)],
  [/^margin-left$/, (v) => sp("ml", v)],
  [/^margin-right$/, (v) => sp("mr", v)],
  [/^padding$/, (v) => sp("p", v)],
  [/^padding-top$/, (v) => sp("pt", v)],
  [/^padding-bottom$/, (v) => sp("pb", v)],
  [/^padding-left$/, (v) => sp("pl", v)],
  [/^padding-right$/, (v) => sp("pr", v)],
  [/^gap$/, (v) => sp("gap", v)],
  [/^color$/, (v) => `text-[${v.replace(/\s/g, "")}]`],
  [/^background(-color)?$/, (v) => `bg-[${v.replace(/\s/g, "")}]`],
  [/^font-size$/, (v) => `text-[${v}]`],
  [/^line-height$/, (v) => `leading-[${v}]`],
  [/^width$/, (v) => `w-[${v}]`],
  [/^height$/, (v) => `h-[${v}]`],
  [/^max-width$/, (v) => `max-w-[${v}]`],
  [/^border-radius$/, (v) => `rounded-[${v}]`],
  [/^box-shadow$/, () => "shadow-lg"],
  [/^border$/, (v) => `border border-[${(v.split(" ").pop() ?? "").trim()}]`],
  [/^opacity$/, (v) => `opacity-[${v}]`],
  [/^z-index$/, (v) => `z-[${v}]`],
];

function sp(prefix: string, v: string): string {
  const key = v.trim();
  const scale = SPACING[key];
  return scale ? `${prefix}-${scale}` : `${prefix}-[${key}]`;
}

export function convertStyleAttribute(style: string): string[] {
  return style
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((decl) => {
      const idx = decl.indexOf(":");
      if (idx < 0) return null;
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const value = decl.slice(idx + 1).trim().toLowerCase();
      const direct = DIRECT[`${prop}:${value}`];
      if (direct) return direct;
      for (const [re, fn] of PREFIXED) if (re.test(prop)) return fn(value);
      return null;
    })
    .filter((x): x is string => Boolean(x));
}

export function htmlToTailwind(input: string): string {
  return input.replace(/<([a-zA-Z][\w-]*)([^>]*)>/g, (full, tag: string, attrs: string) => {
    const styleMatch = attrs.match(/\sstyle\s*=\s*"([^"]*)"/i);
    if (!styleMatch) return full;
    const utils = convertStyleAttribute(styleMatch[1]);
    let rest = attrs.replace(styleMatch[0], "");
    const classMatch = rest.match(/\sclass(Name)?\s*=\s*"([^"]*)"/i);
    const existing = classMatch ? classMatch[2].trim() : "";
    if (classMatch) rest = rest.replace(classMatch[0], "");
    const merged = [existing, ...utils].filter(Boolean).join(" ");
    return `<${tag}${rest.replace(/\s+$/, "")}${merged ? ` class="${merged}"` : ""}>`;
  });
}

const SAMPLE = `<div style="display:flex; align-items:center; gap:12px; padding:16px; background:#f8fafc; border-radius:16px">
  <span style="font-weight:600; font-size:14px; color:#38bdf8">DevMatrix</span>
</div>`;

export default function HtmlToTailwind() {
  const [input, setInput] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);
  const output = useMemo(() => htmlToTailwind(input), [input]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass p-5">
        <label className="text-xs font-medium text-muted-foreground">HTML with inline styles</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          spellCheck={false}
          className="mt-2 w-full resize-y rounded-lg border border-input bg-surface p-3 font-mono text-xs leading-relaxed outline-none focus:border-[color:var(--primary)]"
        />
      </div>
      <div className="glass p-5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Tailwind output</label>
          <button
            onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-2"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[color:var(--primary)]" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="mt-2 h-[26rem] overflow-auto rounded-lg bg-surface p-3 font-mono text-xs leading-relaxed">{output}</pre>
      </div>
    </div>
  );
}
