import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBio, upsertBioPage, saveBlocks } from "@/lib/bio.functions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, GripVertical, Trash2, ArrowUp, ArrowDown, ExternalLink, Upload, Check, Loader2 } from "lucide-react";

type Block = { id?: string; block_type: "link" | "social" | "coupon" | "header"; position: number; data: Record<string, unknown> };

export const THEME_COLORS = [
  { name: "Porcelain", bg: "#f8fafc", fg: "#1e293b", accent: "#4f46e5" },
  { name: "Indigo", bg: "#eef2ff", fg: "#312e81", accent: "#4f46e5" },
  { name: "Sand", bg: "#faf7f2", fg: "#44403c", accent: "#b45309" },
  { name: "Sage", bg: "#f2f7f4", fg: "#1f3d2f", accent: "#15803d" },
  { name: "Blush", bg: "#fdf2f6", fg: "#4c1d3d", accent: "#be185d" },
  { name: "Slate", bg: "#1e293b", fg: "#f8fafc", accent: "#a5b4fc" },
];

export const Route = createFileRoute("/_authenticated/bio")({
  head: () => ({
    meta: [
      { title: "Bio Page Configuration — DevMatrix" },
      { name: "description", content: "Configure your DevMatrix link-in-bio page: avatar, theme colour and blocks with a live mobile preview." },
      { property: "og:title", content: "Bio Page Configuration — DevMatrix" },
      { property: "og:description", content: "Upload an avatar, pick a theme colour and arrange your bio blocks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BioBuilder,
});

function BioBuilder() {
  const qc = useQueryClient();
  const fetch = useServerFn(getMyBio);
  const upsert = useServerFn(upsertBioPage);
  const save = useServerFn(saveBlocks);
  const { data } = useQuery({ queryKey: ["bio"], queryFn: () => fetch() });

  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState(THEME_COLORS[0]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data?.page) return;
    setSlug(data.page.slug);
    setDisplayName(data.page.display_name ?? "");
    setBio(data.page.bio ?? "");
    setAvatarUrl(data.page.avatar_url ?? null);
    const saved = (data.page.theme ?? null) as { bg?: string } | null;
    if (saved?.bg) {
      const match = THEME_COLORS.find((c) => c.bg === saved.bg);
      setTheme(match ?? { name: "Custom", bg: saved.bg, fg: readableFg(saved.bg), accent: (saved as { accent?: string }).accent ?? "#6366f1" });
    }
    setBlocks((data.blocks as Block[]) ?? []);
  }, [data]);

  async function onAvatarPick(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 3_000_000) return toast.error("Image must be under 3MB");
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "png";
      const path = `${auth.user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: signed, error: signErr } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (signErr || !signed) throw signErr ?? new Error("Could not create image link");
      setAvatarUrl(signed.signedUrl);
      toast.success("Avatar uploaded — remember to save");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const savePage = useMutation({
    mutationFn: async () => {
      const page = await upsert({
        data: {
          slug,
          display_name: displayName || null,
          bio: bio || null,
          avatar_url: avatarUrl || null,
          theme: { bg: theme.bg, fg: theme.fg, accent: theme.accent, name: theme.name },
        },
      });
      await save({ data: { page_id: page.id, blocks: blocks.map((b, i) => ({ ...b, position: i })) } });
      return page;
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["bio"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  function addBlock(t: Block["block_type"]) {
    const defaults: Record<Block["block_type"], Block["data"]> = {
      link: { label: "New Link", url: "https://" },
      social: { platform: "instagram", handle: "" },
      coupon: { code: "SAVE10", description: "10% off", expires_at: "" },
      header: { text: "Section" },
    };
    setBlocks([...blocks, { block_type: t, position: blocks.length, data: defaults[t] }]);
  }
  function updateBlock(i: number, patch: Partial<Block["data"]>) {
    const next = [...blocks]; next[i] = { ...next[i], data: { ...next[i].data, ...patch } }; setBlocks(next);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir; if (j < 0 || j >= blocks.length) return;
    const next = [...blocks]; [next[i], next[j]] = [next[j], next[i]]; setBlocks(next);
  }
  function remove(i: number) { setBlocks(blocks.filter((_, x) => x !== i)); }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-10 md:py-10">
      <header className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">Bio Page Configuration</h1>
          <p className="mt-1 text-sm text-muted-foreground">Avatar, theme colour and blocks — with a live mobile preview.</p>
        </div>
        <div className="flex items-center gap-2">
          {data?.page && (
            <a href={`/b/${data.page.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-2">
              <ExternalLink className="h-3.5 w-3.5" /> View public
            </a>
          )}
          <button onClick={() => savePage.mutate()} disabled={savePage.isPending || !slug} className="rounded-xl bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] disabled:opacity-50">
            {savePage.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="glass space-y-4 p-6">
            <h2 className="text-sm font-semibold tracking-tight">Profile</h2>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-2">
                {avatarUrl ? <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" /> : <span className="text-xs text-muted-foreground">No image</span>}
              </div>
              <div className="min-w-0">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onAvatarPick(f); e.target.value = ""; }} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-2 disabled:opacity-60">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploading ? "Uploading…" : "Upload avatar"}
                </button>
                {avatarUrl && (
                  <button onClick={() => setAvatarUrl(null)} className="ml-2 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:text-destructive">Remove</button>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground">PNG or JPG, up to 3MB.</p>
              </div>
            </div>
            <label className="block text-xs font-medium text-muted-foreground">Slug
              <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} className="input mt-1.5" placeholder="your-name" />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">Display name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input mt-1.5" />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">Bio
              <textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} className="input mt-1.5" />
            </label>
          </div>

          <div className="glass p-6">
            <h2 className="text-sm font-semibold tracking-tight">Theme colour</h2>
            <p className="mt-1 text-xs text-muted-foreground">Sets the background of your public bio page.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {THEME_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setTheme(c)}
                  title={c.name}
                  className={`grid h-11 w-11 place-items-center rounded-full border-2 ${theme.bg === c.bg ? "border-[color:var(--primary)]" : "border-border"}`}
                  style={{ background: c.bg }}
                >
                  {theme.bg === c.bg && <Check className="h-4 w-4" style={{ color: c.accent }} />}
                </button>
              ))}
              <label className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border-2 border-dashed border-border text-[10px] text-muted-foreground">
                <input type="color" value={theme.bg} onChange={(e) => setTheme({ name: "Custom", bg: e.target.value, fg: readableFg(e.target.value), accent: "#6366f1" })} className="h-0 w-0 opacity-0" />
                +
              </label>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Active: <span className="font-medium text-foreground">{theme.name}</span> {theme.bg}</p>
          </div>

          <div className="glass p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h2 className="truncate text-sm font-semibold tracking-tight">Blocks</h2>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                {(["link", "social", "coupon", "header"] as const).map((t) => (
                  <button key={t} onClick={() => addBlock(t)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium capitalize hover:bg-surface-2">
                    <Plus className="h-3 w-3" /> {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {blocks.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">No blocks yet.</p>}
              {blocks.map((b, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      <GripVertical className="h-3 w-3 shrink-0" /> <span className="truncate">{b.block_type}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <button onClick={() => move(i, -1)} className="rounded p-1 text-muted-foreground hover:bg-surface-2"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button onClick={() => move(i, 1)} className="rounded p-1 text-muted-foreground hover:bg-surface-2"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button onClick={() => remove(i)} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </span>
                  </div>
                  <BlockEditor block={b} onChange={(p) => updateBlock(i, p)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-fit lg:sticky lg:top-6">
          <div className="glass p-5">
            <h2 className="mb-4 text-sm font-semibold tracking-tight">Live preview</h2>
            <div className="mx-auto max-w-[280px] rounded-[2rem] border border-border p-5 shadow-[var(--shadow-lift)]" style={{ background: theme.bg, color: theme.fg }}>
              <div className="text-center">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" />
                  : <div className="mx-auto h-16 w-16 rounded-full" style={{ background: theme.accent, opacity: 0.25 }} />}
                <div className="mt-3 text-sm font-semibold">{displayName || "Your name"}</div>
                <div className="mt-1 text-xs opacity-70">{bio || "Bio goes here"}</div>
              </div>
              <div className="mt-4 space-y-2">
                {blocks.map((b, i) => <PreviewBlock key={i} block={b} theme={theme} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (p: Partial<Block["data"]>) => void }) {
  if (block.block_type === "link") return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <input value={String(block.data.label ?? "")} onChange={(e) => onChange({ label: e.target.value })} placeholder="Label" className="input" />
      <input value={String(block.data.url ?? "")} onChange={(e) => onChange({ url: e.target.value })} placeholder="URL" className="input" />
    </div>
  );
  if (block.block_type === "social") return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <select value={String(block.data.platform ?? "instagram")} onChange={(e) => onChange({ platform: e.target.value })} className="input">
        <option value="instagram">Instagram</option><option value="twitter">Twitter/X</option><option value="tiktok">TikTok</option>
        <option value="youtube">YouTube</option><option value="linkedin">LinkedIn</option>
      </select>
      <input value={String(block.data.handle ?? "")} onChange={(e) => onChange({ handle: e.target.value })} placeholder="@handle" className="input" />
    </div>
  );
  if (block.block_type === "coupon") return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
      <input value={String(block.data.code ?? "")} onChange={(e) => onChange({ code: e.target.value })} placeholder="CODE" className="input" />
      <input value={String(block.data.description ?? "")} onChange={(e) => onChange({ description: e.target.value })} placeholder="Description" className="input" />
      <input type="datetime-local" value={String(block.data.expires_at ?? "")} onChange={(e) => onChange({ expires_at: e.target.value })} className="input" />
    </div>
  );
  return <input value={String(block.data.text ?? "")} onChange={(e) => onChange({ text: e.target.value })} placeholder="Header text" className="input mt-3" />;
}

function PreviewBlock({ block, theme }: { block: Block; theme: { fg: string; accent: string } }) {
  if (block.block_type === "header") return <div className="pt-2 text-[10px] font-semibold uppercase tracking-wider opacity-70">{String(block.data.text)}</div>;
  if (block.block_type === "coupon") {
    const exp = block.data.expires_at ? new Date(String(block.data.expires_at)) : null;
    const expired = exp && exp.getTime() < Date.now();
    return (
      <div className="rounded-xl border p-3 text-center" style={{ borderColor: expired ? "#ef4444" : theme.accent, color: expired ? "#ef4444" : theme.accent }}>
        <div className="text-[10px] uppercase">{expired ? "Expired" : "Coupon"}</div>
        <div className="text-base font-semibold tracking-widest">{String(block.data.code)}</div>
        <div className="text-[10px] opacity-70">{String(block.data.description)}</div>
      </div>
    );
  }
  const label = block.block_type === "social" ? `@${block.data.handle} on ${block.data.platform}` : String(block.data.label);
  return (
    <div className="rounded-xl border px-4 py-2.5 text-center text-xs font-medium" style={{ borderColor: `${theme.fg}22`, background: `${theme.fg}0a` }}>
      {label}
    </div>
  );
}

function readableFg(bg: string) {
  const h = bg.replace("#", "");
  if (h.length !== 6) return "#1e293b";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#1e293b" : "#f8fafc";
}
