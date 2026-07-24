import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sanitizeUrl } from "@/lib/url";

const FREE_TIER_LIMIT = 5;

const urlField = z.preprocess((v) => sanitizeUrl(v), z.string().url());

const geoRulesSchema = z.preprocess(
  (v) => {
    if (!v || typeof v !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const clean = sanitizeUrl(val);
      if (clean) out[k.toUpperCase()] = clean;
    }
    return out;
  },
  z.record(z.string().length(2), z.string().url()),
);

const createSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/i),
  title: z.string().max(120).optional().nullable(),
  default_url: urlField,
  geo_rules: geoRulesSchema.optional().default({}),
  deep_link_enabled: z.boolean().default(true),
  expires_at: z.string().datetime().optional().nullable(),
});

export const listMyLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("smart_links")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getLink = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: link, error } = await context.supabase
      .from("smart_links")
      .select("*, qr_codes(*)")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!link) throw new Error("Not found");

    const { data: analytics } = await context.supabase
      .from("analytics_logs")
      .select("*")
      .eq("link_id", data.id)
      .order("timestamp", { ascending: false })
      .limit(500);
    return { link, analytics: analytics ?? [] };
  });

export const createLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles").select("subscription_status").eq("id", context.userId).maybeSingle();
    const { count } = await context.supabase
      .from("smart_links").select("*", { count: "exact", head: true }).eq("user_id", context.userId);
    if ((profile?.subscription_status ?? "free") === "free" && (count ?? 0) >= FREE_TIER_LIMIT) {
      throw new Error(`Free tier limit reached (${FREE_TIER_LIMIT} links). Upgrade to Pro for unlimited.`);
    }

    const { data: link, error } = await context.supabase
      .from("smart_links")
      .insert({ ...data, user_id: context.userId })
      .select().single();
    if (error) throw new Error(error.message);
    await context.supabase.from("qr_codes").insert({ link_id: link.id });
    return link;
  });

export const updateLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      patch: createSchema.partial().extend({ is_active: z.boolean().optional() }),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: link, error } = await context.supabase
      .from("smart_links").update(data.patch)
      .eq("id", data.id).eq("user_id", context.userId)
      .select().single();
    if (error) throw new Error(error.message);
    return link;
  });

export const deleteLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("smart_links").delete()
      .eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateQrStyle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      link_id: z.string().uuid(),
      settings: z.object({ fg: z.string(), bg: z.string(), margin: z.number().optional(), scale: z.number().optional() }),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase.from("qr_codes")
      .select("id").eq("link_id", data.link_id).maybeSingle();
    if (existing) {
      const { error } = await context.supabase.from("qr_codes")
        .update({ qr_style_settings: data.settings }).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("qr_codes")
        .insert({ link_id: data.link_id, qr_style_settings: data.settings });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const getAllAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: links } = await context.supabase
      .from("smart_links").select("id, slug, title").eq("user_id", context.userId);
    const ids = (links ?? []).map((l) => l.id);
    if (ids.length === 0) return { logs: [], links: [], totalClicks: 0 };
    const { data: logs } = await context.supabase
      .from("analytics_logs")
      .select("link_id, country, device_type, os, timestamp")
      .in("link_id", ids)
      .order("timestamp", { ascending: false })
      .limit(2000);
    return { logs: logs ?? [], links: links ?? [], totalClicks: logs?.length ?? 0 };
  });
