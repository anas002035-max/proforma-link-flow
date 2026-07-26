import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBio, upsertBioPage, saveBlocks } from "@/lib/bio.functions";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, GripVertical, Trash2, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";

type Block = { id?: string; block_type: "link" | "social" | "coupon" | "header"; position: number; data: Record<string, unknown> };

export const Route = createFileRoute("/_authenticated/bio")({
  head: () => ({ meta: [{ title: "Bio Builder — DevMatrix" }, { name: "description", content: "Build your link-in-bio page." }] }),
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
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    if (!data) return;
    if (data.page) {
      setSlug(data.page.slug);
      setDisplayName(data.page.display_name ?? "");
      setBio(data.page.bio ?? "");
      setBlocks((data.blocks as Block[]) ?? []);
    }
  }, [data]);

  const savePage = useMutation({
    mutationFn: async () => {
      const page = await upsert({ data: { slug, display_name: displayName || null, bio: bio || null } });
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
    <div className="p-6 md:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Bio Builder</h1>
          <p className="text-sm text-muted-foreground">Design your link-in-bio page. Live preview on the right.</p>
        </div>
        <div className="flex items-center gap-2">
          {data?.page && <a href={`/b/${data.page.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs hover:bg-surface-2"><ExternalLink className="h-3 w-3" /> View public</a>}
          <button onClick={() => savePage.mutate()} disabled={savePage.isPending || !slug} className="rounded-xl bg-[image:var(--gradient-neon)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)]">
            {savePage.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* EDITOR */}
        <div className="space-y-4">
          <div className="glass p-5 space-y-3">
            <h2 className="font-semibold">Page settings</h2>
            <label className="block text-xs">Slug<input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} pattern="[a-z0-9\-]+" className="input" placeholder="your-name" /></label>
            <label className="block text-xs">Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" /></label>
            <label className="block text-xs">Bio<textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} className="input" /></label>
          </div>
          <div className="glass p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Blocks</h2>
              <div className="flex gap-1">
                <button onClick={() => addBlock("link")} className="rounded border border-input bg-surface px-2 py-1 text-xs hover:bg-surface-2 inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Link</button>
                <button onClick={() => addBlock("social")} className="rounded border border-input bg-surface px-2 py-1 text-xs hover:bg-surface-2 inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Social</button>
                <button onClick={() => addBlock("coupon")} className="rounded border border-input bg-surface px-2 py-1 text-xs hover:bg-surface-2 inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Coupon</button>
                <button onClick={() => addBlock("header")} className="rounded border border-input bg-surface px-2 py-1 text-xs hover:bg-surface-2 inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Header</button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {blocks.map((b, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <GripVertical className="h-3 w-3" /> <span className="uppercase tracking-wider">{b.block_type}</span>
                    <div className="ml-auto flex gap-1">
                      <button onClick={() => move(i, -1)}><ArrowUp className="h-3 w-3" /></button>
                      <button onClick={() => move(i, 1)}><ArrowDown className="h-3 w-3" /></button>
                      <button onClick={() => remove(i)} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <BlockEditor block={b} onChange={(p) => updateBlock(i, p)} />
                </div>
              ))}
              {blocks.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No blocks yet — add one above.</p>}
            </div>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="glass p-4">
            <div className="mx-auto max-w-[280px] rounded-[2rem] border-4 border-surface-2 bg-[#0B0F19] p-4 shadow-[var(--glow-blue)]">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-[image:var(--gradient-neon)]" />
                <div className="mt-3 font-bold text-white">{displayName || "Your name"}</div>
                <div className="text-xs text-white/60">{bio || "Bio goes here"}</div>
              </div>
              <div className="mt-4 space-y-2">
                {blocks.map((b, i) => <PreviewBlock key={i} block={b} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid var(--input);background:var(--surface-2);padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;margin-top:0.25rem}`}</style>
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (p: Partial<Block["data"]>) => void }) {
  if (block.block_type === "link") return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <input value={String(block.data.label ?? "")} onChange={(e) => onChange({ label: e.target.value })} placeholder="Label" className="input" />
      <input value={String(block.data.url ?? "")} onChange={(e) => onChange({ url: e.target.value })} placeholder="URL" className="input" />
    </div>
  );
  if (block.block_type === "social") return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <select value={String(block.data.platform ?? "instagram")} onChange={(e) => onChange({ platform: e.target.value })} className="input">
        <option value="instagram">Instagram</option><option value="twitter">Twitter/X</option><option value="tiktok">TikTok</option>
        <option value="youtube">YouTube</option><option value="linkedin">LinkedIn</option>
      </select>
      <input value={String(block.data.handle ?? "")} onChange={(e) => onChange({ handle: e.target.value })} placeholder="@handle" className="input" />
    </div>
  );
  if (block.block_type === "coupon") return (
    <div className="mt-2 grid grid-cols-3 gap-2">
      <input value={String(block.data.code ?? "")} onChange={(e) => onChange({ code: e.target.value })} placeholder="CODE" className="input" />
      <input value={String(block.data.description ?? "")} onChange={(e) => onChange({ description: e.target.value })} placeholder="Description" className="input col-span-1" />
      <input type="datetime-local" value={String(block.data.expires_at ?? "")} onChange={(e) => onChange({ expires_at: e.target.value })} className="input" />
    </div>
  );
  return <input value={String(block.data.text ?? "")} onChange={(e) => onChange({ text: e.target.value })} placeholder="Header text" className="input mt-2" />;
}

function PreviewBlock({ block }: { block: Block }) {
  if (block.block_type === "header") return <div className="pt-2 text-xs font-bold uppercase tracking-wider text-white/80">{String(block.data.text)}</div>;
  if (block.block_type === "coupon") {
    const exp = block.data.expires_at ? new Date(String(block.data.expires_at)) : null;
    const expired = exp && exp.getTime() < Date.now();
    return (
      <div className={`rounded-xl border p-3 text-center ${expired ? "border-destructive/50 text-destructive" : "border-[color:var(--neon-green)]/50 text-[color:var(--neon-green)]"}`}>
        <div className="text-[10px] uppercase">{expired ? "Expired" : "Coupon"}</div>
        <div className="text-lg font-black tracking-widest">{String(block.data.code)}</div>
        <div className="text-[10px] text-white/70">{String(block.data.description)}</div>
      </div>
    );
  }
  const label = block.block_type === "social"
    ? `@${block.data.handle} on ${block.data.platform}`
    : String(block.data.label);
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-center text-sm text-white hover:bg-white/10">
      {label}
    </div>
  );
}
