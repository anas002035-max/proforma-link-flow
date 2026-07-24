// Robust URL sanitizer — handles markdown links, brackets, duplicates, missing scheme.
export function sanitizeUrl(input: unknown): string {
  if (typeof input !== "string") return "";
  let s = input.trim();
  if (!s) return "";

  // Markdown link [text](url) — extract the url in parens
  const md = s.match(/\[[^\]]*\]\(([^)]+)\)/);
  if (md) s = md[1];

  // Strip wrapping brackets / quotes / whitespace repeatedly
  s = s.replace(/^[\s\[\(<"'`]+/, "").replace(/[\s\]\)>"'`]+$/, "").trim();

  // If the same URL got duplicated ("https://a.com https://a.com" or "urlurl")
  // take the first whitespace-delimited token.
  s = s.split(/\s+/)[0];

  // Detect a duplicated concatenation like https://x.comhttps://x.com
  const dup = s.match(/^(https?:\/\/[^\s]+?)(https?:\/\/.+)$/i);
  if (dup) s = dup[1];

  // Trailing punctuation from prose
  s = s.replace(/[),.;!?\]]+$/g, "");

  // Add scheme if it looks like a bare domain
  if (s && !/^https?:\/\//i.test(s) && /^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(s)) {
    s = "https://" + s;
  }

  return s;
}

export function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}
