import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyBio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: page } = await context.supabase
      .from("bio_pages").select("*").eq("user_id", context.userId).maybeSingle();
    if (!page) return { page: null, blocks: [] };
    const { data: blocks } = await context.supabase
      .from("bio_blocks").select("*").eq("page_id", page.id).order("position", { ascending: true });
    return { page, blocks: blocks ?? [] };
  });

export const upsertBioPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/i),
      display_name: z.string().max(80).optional().nullable(),
      bio: z.string().max(500).optional().nullable(),
      avatar_url: z.string().url().optional().nullable(),
      theme: z.record(z.string(), z.any()).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("bio_pages").select("id").eq("user_id", context.userId).maybeSingle();
    if (existing) {
      const { data: page, error } = await context.supabase.from("bio_pages")
        .update(data).eq("id", existing.id).select().single();
      if (error) throw new Error(error.message);
      return page;
    }
    const { data: page, error } = await context.supabase.from("bio_pages")
      .insert({ ...data, user_id: context.userId }).select().single();
    if (error) throw new Error(error.message);
    return page;
  });

export const saveBlocks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      page_id: z.string().uuid(),
      blocks: z.array(z.object({
        id: z.string().uuid().optional(),
        block_type: z.enum(["link", "social", "coupon", "header"]),
        position: z.number().int(),
        data: z.record(z.string(), z.any()),
      })),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // ownership check
    const { data: page } = await context.supabase.from("bio_pages")
      .select("id").eq("id", data.page_id).eq("user_id", context.userId).maybeSingle();
    if (!page) throw new Error("Not found");
    // simplest strategy: delete then reinsert
    await context.supabase.from("bio_blocks").delete().eq("page_id", data.page_id);
    if (data.blocks.length > 0) {
      const { error } = await context.supabase.from("bio_blocks").insert(
        data.blocks.map((b) => ({
          page_id: data.page_id,
          block_type: b.block_type,
          position: b.position,
          data: b.data,
        })),
      );
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
