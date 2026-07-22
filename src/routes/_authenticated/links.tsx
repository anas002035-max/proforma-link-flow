import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyLinks, createLink, deleteLink } from "@/lib/links.functions";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, QrCode } from "lucide-react";

export const Route = createFileRoute("/_authenticated/links")({
  head: () => ({ meta: [{ title: "Smart Links — Proforma Hub" }, { name: "description", content: "Create and manage smart links." }] }),
  component: LinksPage,
});

function LinksPage() {
  const qc = useQueryClient();
  const fetchLinks = useServerFn(listMyLinks);
  const create = useServerFn(createLink);
  const del = useServerFn(deleteLink);
  const { data: links = [] } = useQuery({ queryKey: ["my-links"], queryFn: () => fetchLinks() });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ slug: "", title: "", default_url: "", geo: "{}", deep_link_enabled: true, expires_at: "" });

  const createMut = useMutation({
    mutationFn: async () => {
      let geo_rules = {};
      try { geo_rules = JSON.parse(form.geo || "{}"); } catch { throw new Error("Invalid geo rules JSON"); }
      return create({ data: {
        slug: form.slug, title: form.title || null, default_url: form.default_url,
        geo_rules, deep_link_enabled: form.deep_link_enabled,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      } });
    },
    onSuccess: () => {
      toast.success("Link created");
      setOpen(false);
      setForm({ slug: "", title: "", default_url: "", geo: "{}", deep_link_enabled: true, expires_at: "" });
      qc.invalidateQueries({ queryKey: ["my-links"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["my-links"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Smart Links</h1>
          <p className="text-sm text-muted-foreground">Geo-targeted, deep-linked, expirable.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-neon)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)]">
          <Plus className="h-4 w-4" /> New link
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map((l) => (
          <div key={l.id} className="glass p-5 hover:translate-y-[-2px]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{l.title || l.slug}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-[color:var(--neon-blue)]">
                  proforma.link/{l.slug}
                </div>
              </div>
              <button onClick={() => confirm("Delete this link?") && delMut.mutate(l.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 truncate text-xs text-muted-foreground">→ {l.default_url}</div>
            <div className="mt-3 flex flex-wrap gap-1">
              {l.deep_link_enabled && <Badge>deep-link</Badge>}
              {l.geo_rules && Object.keys(l.geo_rules as Record<string, unknown>).length > 0 && <Badge>geo</Badge>}
              {l.expires_at && <Badge>expires</Badge>}
            </div>
            <div className="mt-4 flex gap-2">
              <Link to="/links/$id" params={{ id: l.id }} className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-center text-xs hover:bg-surface-2 inline-flex items-center justify-center gap-1">
                <QrCode className="h-3 w-3" /> QR & Analytics
              </Link>
              <a href={`/api/public/r/${l.slug}`} target="_blank" rel="noreferrer" className="rounded-lg border border-border bg-surface p-1.5 text-xs hover:bg-surface-2">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ))}
        {links.length === 0 && (
          <div className="glass col-span-full p-10 text-center text-sm text-muted-foreground">
            No smart links yet. Click <b>New link</b> to create one.
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="glass w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">New smart link</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="mt-4 space-y-3">
              <Field label="Slug">
                <input required pattern="[a-z0-9\-]+" minLength={3} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} className="input" placeholder="summer-sale" />
              </Field>
              <Field label="Title (optional)">
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Summer campaign" />
              </Field>
              <Field label="Default destination URL">
                <input required type="url" value={form.default_url} onChange={(e) => setForm({ ...form, default_url: e.target.value })} className="input" placeholder="https://example.com" />
              </Field>
              <Field label='Geo rules (JSON, e.g. {"SA": "https://ar.example.com"})'>
                <textarea rows={3} value={form.geo} onChange={(e) => setForm({ ...form, geo: e.target.value })} className="input font-mono text-xs" />
              </Field>
              <Field label="Expires at (optional)">
                <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="input" />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.deep_link_enabled} onChange={(e) => setForm({ ...form, deep_link_enabled: e.target.checked })} />
                Enable app deep-linking on mobile
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-input bg-surface px-3 py-2 text-sm">Cancel</button>
                <button type="submit" disabled={createMut.isPending} className="flex-1 rounded-lg bg-[image:var(--gradient-neon)] px-3 py-2 text-sm font-semibold text-[color:var(--primary-foreground)]">
                  {createMut.isPending ? "Creating…" : "Create link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid var(--input);background:var(--surface);padding:0.5rem 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:var(--neon-blue);box-shadow:var(--glow-blue)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{children}</span>;
}
