
-- Subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro_early', 'pro');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  subscription_status public.subscription_tier NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Smart links
CREATE TABLE public.smart_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT,
  default_url TEXT NOT NULL,
  geo_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  deep_link_enabled BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX smart_links_slug_idx ON public.smart_links (slug);
CREATE INDEX smart_links_user_idx ON public.smart_links (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.smart_links TO authenticated;
GRANT SELECT ON public.smart_links TO anon;
GRANT ALL ON public.smart_links TO service_role;
ALTER TABLE public.smart_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage smart_links" ON public.smart_links FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read active smart_links" ON public.smart_links FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read active smart_links auth" ON public.smart_links FOR SELECT TO authenticated USING (is_active = true);

-- QR codes
CREATE TABLE public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.smart_links(id) ON DELETE CASCADE,
  qr_style_settings JSONB NOT NULL DEFAULT '{"fg":"#0B0F19","bg":"#FFFFFF","margin":2,"scale":8}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX qr_codes_link_idx ON public.qr_codes (link_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_codes TO authenticated;
GRANT ALL ON public.qr_codes TO service_role;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage qr_codes" ON public.qr_codes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.smart_links sl WHERE sl.id = link_id AND sl.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.smart_links sl WHERE sl.id = link_id AND sl.user_id = auth.uid()));

-- Analytics logs (append-only)
CREATE TABLE public.analytics_logs (
  id BIGSERIAL PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.smart_links(id) ON DELETE CASCADE,
  country TEXT,
  device_type TEXT,
  os TEXT,
  referrer TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX analytics_link_ts_idx ON public.analytics_logs (link_id, timestamp DESC);
GRANT SELECT ON public.analytics_logs TO authenticated;
GRANT ALL ON public.analytics_logs TO service_role;
ALTER TABLE public.analytics_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read analytics" ON public.analytics_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.smart_links sl WHERE sl.id = link_id AND sl.user_id = auth.uid()));

-- Bio pages
CREATE TABLE public.bio_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  theme JSONB NOT NULL DEFAULT '{"bg":"#0B0F19","accent":"#22d3ee"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bio_pages_slug_idx ON public.bio_pages (slug);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bio_pages TO authenticated;
GRANT SELECT ON public.bio_pages TO anon;
GRANT ALL ON public.bio_pages TO service_role;
ALTER TABLE public.bio_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage bio_pages" ON public.bio_pages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read bio_pages anon" ON public.bio_pages FOR SELECT TO anon USING (true);
CREATE POLICY "Public read bio_pages auth" ON public.bio_pages FOR SELECT TO authenticated USING (true);

-- Bio blocks
CREATE TABLE public.bio_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bio_blocks_page_pos_idx ON public.bio_blocks (page_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bio_blocks TO authenticated;
GRANT SELECT ON public.bio_blocks TO anon;
GRANT ALL ON public.bio_blocks TO service_role;
ALTER TABLE public.bio_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage bio_blocks" ON public.bio_blocks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bio_pages p WHERE p.id = page_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.bio_pages p WHERE p.id = page_id AND p.user_id = auth.uid()));
CREATE POLICY "Public read bio_blocks anon" ON public.bio_blocks FOR SELECT TO anon USING (true);
CREATE POLICY "Public read bio_blocks auth" ON public.bio_blocks FOR SELECT TO authenticated USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER smart_links_touch BEFORE UPDATE ON public.smart_links FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER bio_pages_touch BEFORE UPDATE ON public.bio_pages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
