-- 1. smart_links: remove blanket public read (exposed password_hash)
DROP POLICY IF EXISTS "Public read active smart_links" ON public.smart_links;
DROP POLICY IF EXISTS "Public read active smart_links auth" ON public.smart_links;

-- Safe public projection (excludes password_hash, user_id)
CREATE OR REPLACE VIEW public.smart_links_public AS
  SELECT id, slug, title, default_url, geo_rules, deep_link_enabled, expires_at, is_active
  FROM public.smart_links
  WHERE is_active = true;

GRANT SELECT ON public.smart_links_public TO anon, authenticated;
GRANT ALL ON public.smart_links_public TO service_role;

-- 2. bio_pages: publish flag + scoped public read
ALTER TABLE public.bio_pages ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Public read bio_pages anon" ON public.bio_pages;
DROP POLICY IF EXISTS "Public read bio_pages auth" ON public.bio_pages;

CREATE POLICY "Public read published bio_pages anon"
  ON public.bio_pages FOR SELECT TO anon
  USING (is_published = true);

CREATE POLICY "Public read published bio_pages auth"
  ON public.bio_pages FOR SELECT TO authenticated
  USING (is_published = true OR auth.uid() = user_id);

-- 3. bio_blocks: only for published pages
DROP POLICY IF EXISTS "Public read bio_blocks anon" ON public.bio_blocks;
DROP POLICY IF EXISTS "Public read bio_blocks auth" ON public.bio_blocks;

CREATE POLICY "Public read bio_blocks of published pages anon"
  ON public.bio_blocks FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.bio_pages p
    WHERE p.id = bio_blocks.page_id AND p.is_published = true
  ));

CREATE POLICY "Public read bio_blocks of published pages auth"
  ON public.bio_blocks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bio_pages p
    WHERE p.id = bio_blocks.page_id
      AND (p.is_published = true OR p.user_id = auth.uid())
  ));