import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const fetchPublicBio = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const sb = createClient<Database>(process.env.SUPABASE_URL!, key, {
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
    const { data: page } = await sb.from("bio_pages").select("*").eq("slug", data.slug).maybeSingle();
    if (!page) return null;
    const { data: blocks } = await sb.from("bio_blocks").select("*").eq("page_id", page.id).order("position");
    return { page, blocks: blocks ?? [] };
  });

export const Route = createFileRoute("/b/$slug")({
  loader: async ({ params }) => {
    const result = await fetchPublicBio({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.page.display_name || loaderData.page.slug} — DevMatrix` },
          { name: "description", content: loaderData.page.bio || "Link-in-bio page" },
          { property: "og:title", content: loaderData.page.display_name || loaderData.page.slug },
          { property: "og:description", content: loaderData.page.bio || "Link-in-bio page" },
        ]
      : [{ title: "Not found" }, { name: "robots", content: "noindex" }],
  }),
  component: PublicBio,
});

function PublicBio() {
  const { page, blocks } = Route.useLoaderData();
  const theme = (page.theme ?? null) as { bg?: string; fg?: string; accent?: string } | null;
  const bg = theme?.bg ?? "#f8fafc";
  const fg = theme?.fg ?? "#1e293b";
  const accent = theme?.accent ?? "#4f46e5";
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12" style={{ background: bg, color: fg }}>
      <div className="w-full max-w-md text-center">
        {page.avatar_url && <img src={page.avatar_url} alt={`${page.display_name || page.slug} avatar`} className="mx-auto h-24 w-24 rounded-full object-cover shadow-[var(--shadow-soft)]" />}
        {!page.avatar_url && <div className="mx-auto h-24 w-24 rounded-full" style={{ background: accent, opacity: 0.25 }} />}
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{page.display_name || page.slug}</h1>
        {page.bio && <p className="mt-2 text-sm opacity-70">{page.bio}</p>}
        <div className="mt-7 space-y-3">

          {(blocks as Array<{ id: string; block_type: string; data: Record<string, unknown> }>).map((b) => {
            if (b.block_type === "header") return <div key={b.id} className="pt-3 text-xs font-semibold uppercase tracking-wider opacity-60">{String(b.data.text)}</div>;
            if (b.block_type === "coupon") {
              const exp = b.data.expires_at ? new Date(String(b.data.expires_at)) : null;
              const expired = exp && exp.getTime() < Date.now();
              return (
                <div key={b.id} className={`rounded-2xl border p-4 ${expired ? "opacity-50" : ""}`} style={{ borderColor: `${fg}1f`, background: `${fg}08` }}>
                  <div className="text-[10px] uppercase opacity-60">{expired ? "Expired" : "Coupon"}</div>
                  <div className="text-2xl font-semibold tracking-widest" style={{ color: accent }}>{String(b.data.code)}</div>
                  <div className="text-xs opacity-70">{String(b.data.description)}</div>
                </div>
              );
            }
            const url = b.block_type === "social"
              ? socialUrl(String(b.data.platform), String(b.data.handle))
              : String(b.data.url);
            const label = b.block_type === "social" ? `@${b.data.handle}` : String(b.data.label);
            return (
              <a key={b.id} href={url} target="_blank" rel="noreferrer" className="block rounded-2xl border px-5 py-4 text-center text-sm font-medium hover:translate-y-[-2px]" style={{ borderColor: `${fg}1f`, background: `${fg}08` }}>
                {label}
              </a>
            );
          })}

        </div>
      </div>
    </div>
  );
}

function socialUrl(platform: string, handle: string) {
  const h = handle.replace(/^@/, "");
  switch (platform) {
    case "instagram": return `https://instagram.com/${h}`;
    case "twitter": return `https://x.com/${h}`;
    case "tiktok": return `https://tiktok.com/@${h}`;
    case "youtube": return `https://youtube.com/@${h}`;
    case "linkedin": return `https://linkedin.com/in/${h}`;
    default: return "#";
  }
}
