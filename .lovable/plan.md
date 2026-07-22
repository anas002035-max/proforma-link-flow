# Proforma Hub — Foundation Build Plan

Big scope. I'll ship Phase 1 (infra + schema + dashboard shell + link creation + redirect engine + QR + expiry template). Payments and full bio drag-and-drop polish come in a follow-up phase to keep this shippable.

## Phase 1 — What ships now

### 1. Backend (Lovable Cloud)
Enable Lovable Cloud (Supabase) with:
- `profiles` table (mirrors auth.users, adds `subscription_status` enum: free | pro_early | pro)
- `smart_links` (id, user_id, slug unique, default_url, geo_rules jsonb, deep_link_enabled bool, expires_at, password_hash, title, created_at)
- `qr_codes` (id, link_id FK, qr_style_settings jsonb)
- `analytics_logs` (bigint id, link_id, country, device_type, os, timestamp) — append-only
- `bio_pages` + `bio_blocks` (for Link-in-Bio; blocks have `position` for ordering, `type`, `data` jsonb)
- RLS: users read/write only their own rows; analytics insert open to anon (writes from redirect route); public SELECT on `smart_links` (slug + default_url + geo_rules + deep_link_enabled + expires_at) and `bio_pages`/`bio_blocks` for public rendering
- Grants for authenticated + anon per policies
- Auth: email/password + Google (managed via Lovable Cloud)

### 2. Design system (`src/styles.css`)
Dark-first premium theme:
- `--background` deep charcoal-navy (oklch equivalent of #0B0F19)
- Glass surface tokens: `--surface-glass`, `--surface-glass-border`
- Neon accents: `--neon-blue`, `--neon-green`, plus `--glow-blue`, `--glow-green` shadow tokens
- `--gradient-bento` for card sheen
- Radius 12–16px baseline; utility `.glass` via `@utility` with backdrop-blur

### 3. Routes
- `/auth` — sign in / sign up (email + Google)
- `/` — public marketing landing with CTA
- `/_authenticated/dashboard` — bento grid overview (link count, click totals, recent activity, quick create)
- `/_authenticated/links` — list + create/edit smart link (slug, default URL, geo rules editor, deep link toggle, expiry, password)
- `/_authenticated/links/$id` — detail: analytics + QR customizer canvas
- `/_authenticated/bio` — bio page builder (split view: editor left, mobile preview right; reorder via up/down for phase 1, drag-and-drop later)
- `/b/$slug` — public bio page render
- `/api/public/r/$slug` — redirect engine (server route): looks up slug, checks expiry → expired template, resolves geo (Cloudflare `cf-ipcountry` header) → deep link intent for mobile UA → 302; logs analytics async
- `/expired` — unified "Offer Expired" template

### 4. Features
- Smart link create form with geo rules (key/value list of country→URL) + expiry datepicker + optional password
- QR generator using `qrcode` npm lib rendered to canvas, color pickers for fg/bg, downloads PNG; QR encodes `/api/public/r/{slug}` so destination stays swappable
- Bio builder: add link/social/coupon blocks, reorder, live mobile-frame preview
- Free tier cap: server-enforced max 5 active links (checked in create server fn)

### 5. UX
- Sidebar nav (Dashboard, Smart Links, Bio Page, Analytics, Settings) with neon active-state glow
- Bento cards with glass surface, 0.2s transitions, hover lift + subtle glow

## Phase 2 (follow-up, not this turn)
- Stripe/Paddle checkout for pro tier
- True HTML5 drag-and-drop reorder
- Advanced analytics charts (Recharts)
- Password-gate UI for locked links
- Custom domains

## Technical notes
- Deep-linking: server route inspects UA; for known hosts (youtube.com, instagram.com, twitter.com, amazon.com) returns an HTML shim that tries `app://` scheme then falls back to https after timeout — pure 302 can't reliably fire app intents.
- Geo: rely on Cloudflare `cf-ipcountry` header available at the edge in the Worker runtime.
- Analytics writes: `supabaseAdmin` inside the redirect handler, fire-and-forget.
- QR rendering: `qrcode` package (Worker-safe, pure JS).

Confirm and I'll build Phase 1.
