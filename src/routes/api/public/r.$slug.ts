import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { parseUA, deepLinkFor } from "@/lib/device";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/r/$slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => handle(request, params.slug),
    },
  },
});

async function handle(request: Request, slug: string): Promise<Response> {
  const url = new URL(request.url);
  const origin = url.origin;

  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabasePublic = createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { data: link } = await supabasePublic
    .from("smart_links")
    .select("id, default_url, geo_rules, deep_link_enabled, expires_at, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (!link || !link.is_active) {
    return Response.redirect(origin + "/expired", 302);
  }
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
    return Response.redirect(origin + "/expired", 302);
  }

  const country = request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || null;
  const ua = request.headers.get("user-agent") || "";
  const dev = parseUA(ua);

  let destination = link.default_url;
  const rules = (link.geo_rules ?? {}) as Record<string, string>;
  if (country && rules[country]) destination = rules[country];

  // Async analytics write via service role - fire and forget
  (async () => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("analytics_logs").insert({
        link_id: link.id,
        country,
        device_type: dev.device_type,
        os: dev.os,
        referrer: request.headers.get("referer") || null,
      });
    } catch { /* ignore */ }
  })();

  // Deep-link handling
  if (link.deep_link_enabled && (dev.os === "Android" || dev.os === "iOS")) {
    const intent = deepLinkFor(destination, dev.os);
    if (intent) {
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Opening app…</title>
<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#0B0F19;color:#e5e7eb;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0}a{color:#22d3ee}</style></head>
<body><div style="text-align:center"><p>Opening app…</p><p><a href="${escapeHtml(destination)}">Continue in browser</a></p></div>
<script>
(function(){var t=setTimeout(function(){location.replace(${JSON.stringify(destination)})},1500);window.addEventListener('pagehide',function(){clearTimeout(t)});location.replace(${JSON.stringify(intent)});})();
</script></body></html>`;
      return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
  }

  return Response.redirect(destination, 302);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
