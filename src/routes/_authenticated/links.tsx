import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyLinks, createLink, deleteLink } from "@/lib/links.functions";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, QrCode, Copy, Globe, Smartphone, Clock, X } from "lucide-react";
import { QRPreview } from "@/components/qr-preview";
import { sanitizeUrl, isValidUrl } from "@/lib/url";

export const Route = createFileRoute("/_authenticated/links")({
  head: () => ({ meta: [{ title: "Smart Links — DevMatrix" }, { name: "description", content: "Create and manage smart links." }] }),
  component: LinksPage,
});

const COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" }, { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" }, { code: "FR", name: "France" },
  { code: "ES", name: "Spain" }, { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" }, { code: "SE", name: "Sweden" },
  { code: "BR", name: "Brazil" }, { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" }, { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" }, { code: "CN", name: "China" },
  { code: "IN", name: "India" }, { code: "SG", name: "Singapore" },
  { code: "AE", name: "UAE" }, { code: "SA", name: "Saudi Arabia" },
  { code: "EG", name: "Egypt" }, { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" }, { code: "TR", name: "Turkey" },
];

type GeoRow = { id: string; country: string; url: string };
type FormState = {
  slug: string; title: string; default_url: string;
  deep_link_enabled: boolean; expires_at: string; geo: GeoRow[];
};
const emptyForm = (): FormState => ({
  slug: "", title: "", default_url: "",
  deep_link_enabled: true, expires_at: "", geo: [],
});

function LinksPage() {
  const qc = useQueryClient();
  const fetchLinks = useServerFn(listMyLinks);
  const create = useServerFn(createLink);
  const del = useServerFn(deleteLink);
  const { data: links = [] } = useQuery({ queryKey: ["my-links"], queryFn: () => fetchLinks() });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const createMut = useMutation({
    mutationFn: async () => {
      const default_url = sanitizeUrl(form.default_url);
      if (!isValidUrl(default_url)) throw new Error("Please enter a valid destination URL.");
      const geo_rules: Record<string, string> = {};
      for (const row of form.geo) {
        if (!row.country) continue;
        const clean = sanitizeUrl(row.url);
        if (!clean) continue;
        if (!isValidUrl(clean)) throw new Error(`Invalid URL for ${row.country}`);
        geo_rules[row.country.toUpperCase()] = clean;
      }
      return create({ data: {
        slug: form.slug, title: form.title || null, default_url,
        geo_rules, deep_link_enabled: form.deep_link_enabled,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      } });
    },
    onSuccess: () => {
      toast.success("Smart link created");
      setOpen(false);
      setForm(emptyForm());
      qc.invalidateQueries({ queryKey: ["my-links"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["my-links"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Smart Links</h1>
          <p className="text-sm text-muted-foreground">Geo-targeted, deep-linked, expirable — with live QR.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-neon)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] transition hover:opacity-90">
          <Plus className="h-4 w-4" /> New link
        </button>
      </header>

      {links.length === 0 ? (
        <div className="glass p-12 text-center">
          <QrCode className="mx-auto mb-3 h-10 w-10 text-[color:var(--neon-blue)]" />
          <p className="text-sm text-muted-foreground">No smart links yet. Click <b>New link</b> to create your first one.</p>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.6fr_1.4fr_1fr_120px] gap-4 border-b border-border px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <div>Link</div>
            <div>Destination</div>
            <div>Rules</div>
            <div className="text-right">Actions</div>
          </div>
          <ul className="divide-y divide-border">
            {links.map((l) => (
              <LinkRow key={l.id} link={l} origin={origin} onDelete={() => confirm("Delete this link?") && delMut.mutate(l.id)} />
            ))}
          </ul>
        </div>
      )}

      {open && (
        <NewLinkModal
          form={form} setForm={setForm}
          onClose={() => setOpen(false)}
          onSubmit={() => createMut.mutate()}
          pending={createMut.isPending}
        />
      )}
      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid var(--input);background:var(--surface);padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;transition:all .2s}.input:focus{border-color:var(--neon-blue);box-shadow:var(--glow-blue)}`}</style>
    </div>
  );
}

function LinkRow({ link: l, origin, onDelete }: { link: any; origin: string; onDelete: () => void }) {
  const [showQr, setShowQr] = useState(false);
  const shortUrl = `${origin}/api/public/r/${l.slug}`;
  const geoCount = l.geo_rules ? Object.keys(l.geo_rules as Record<string, unknown>).length : 0;

  return (
    <li className="px-5 py-4">
      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1.4fr_1fr_120px] items-center gap-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{l.title || l.slug}</div>
          <button
            onClick={() => { navigator.clipboard.writeText(shortUrl); toast.success("Copied"); }}
            className="mt-1 inline-flex items-center gap-1 text-xs text-[color:var(--neon-blue)] hover:underline"
          >
            proforma.link/{l.slug} <Copy className="h-3 w-3" />
          </button>
        </div>
        <div className="truncate text-xs text-muted-foreground">→ {l.default_url}</div>
        <div className="flex flex-wrap gap-1.5">
          {l.deep_link_enabled && <Badge icon={<Smartphone className="h-2.5 w-2.5" />}>deep-link</Badge>}
          {geoCount > 0 && <Badge icon={<Globe className="h-2.5 w-2.5" />}>{geoCount} geo</Badge>}
          {l.expires_at && <Badge icon={<Clock className="h-2.5 w-2.5" />}>expires</Badge>}
          {!l.deep_link_enabled && geoCount === 0 && !l.expires_at && <span className="text-[10px] text-muted-foreground">—</span>}
        </div>
        <div className="flex items-center justify-start md:justify-end gap-1">
          <button
            onClick={() => setShowQr((v) => !v)}
            className={`rounded-lg border border-border p-2 text-xs transition hover:bg-surface-2 ${showQr ? "bg-surface-2 text-[color:var(--neon-blue)]" : "bg-surface"}`}
            title="Toggle QR"
          >
            <QrCode className="h-3.5 w-3.5" />
          </button>
          <Link to="/links/$id" params={{ id: l.id }} className="rounded-lg border border-border bg-surface p-2 text-xs hover:bg-surface-2" title="Analytics">
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button onClick={onDelete} className="rounded-lg border border-border bg-surface p-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {showQr && (
        <div className="mt-4 flex flex-col items-center gap-2 border-t border-border pt-4 md:flex-row md:items-start md:gap-6">
          <QRPreview value={shortUrl} fg="#0B0F19" bg="#ffffff" size={180} />
          <div className="text-xs text-muted-foreground">
            <div className="mb-1 font-semibold text-foreground">Dynamic QR</div>
            <div>Points to <code className="text-[color:var(--neon-blue)]">{shortUrl}</code></div>
            <div className="mt-2">Edit destination or styling anytime — the QR image stays the same.</div>
          </div>
        </div>
      )}
    </li>
  );
}

function NewLinkModal({ form, setForm, onClose, onSubmit, pending }: {
  form: FormState; setForm: (f: FormState) => void;
  onClose: () => void; onSubmit: () => void; pending: boolean;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://proforma.link";
  const preview = useMemo(() => `${origin}/api/public/r/${form.slug || "your-slug"}`, [origin, form.slug]);

  const addGeo = () => setForm({ ...form, geo: [...form.geo, { id: crypto.randomUUID(), country: "", url: "" }] });
  const updGeo = (id: string, patch: Partial<GeoRow>) =>
    setForm({ ...form, geo: form.geo.map((r) => r.id === id ? { ...r, ...patch } : r) });
  const rmGeo = (id: string) => setForm({ ...form, geo: form.geo.filter((r) => r.id !== id) });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">New smart link</h2>
            <p className="text-xs text-muted-foreground">One link, infinite destinations.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2"><X className="h-4 w-4" /></button>
        </div>

        <form id="new-link-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <Field label="Default destination URL" hint="Paste any URL — markdown links and brackets are auto-cleaned.">
            <input
              required
              type="text"
              value={form.default_url}
              onChange={(e) => setForm({ ...form, default_url: e.target.value })}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                const clean = sanitizeUrl(pasted);
                if (clean !== pasted) {
                  e.preventDefault();
                  setForm({ ...form, default_url: clean });
                }
              }}
              onBlur={(e) => setForm({ ...form, default_url: sanitizeUrl(e.target.value) })}
              className="input"
              placeholder="https://example.com"
            />
          </Field>

          <Field label="Dynamic slug" hint={preview}>
            <div className="flex items-stretch rounded-lg border border-input bg-surface overflow-hidden focus-within:border-[color:var(--neon-blue)] focus-within:shadow-[var(--glow-blue)]">
              <span className="px-3 py-2 text-xs text-muted-foreground border-r border-input bg-background/40 whitespace-nowrap">proforma.link/</span>
              <input required pattern="[a-z0-9\-]+" minLength={3} value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm outline-none" placeholder="summer-sale" />
            </div>
          </Field>

          <Field label="Title (optional)">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Summer campaign" />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Globe className="h-3 w-3" /> Geo-targeting</div>
                <div className="text-[11px] text-muted-foreground/70">Send visitors from specific countries to custom URLs.</div>
              </div>
              <button type="button" onClick={addGeo} className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs hover:bg-surface-2 inline-flex items-center gap-1">
                <Plus className="h-3 w-3" /> Rule
              </button>
            </div>
            {form.geo.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-surface/50 px-3 py-3 text-center text-[11px] text-muted-foreground">
                No geo rules — everyone gets the default URL.
              </div>
            ) : (
              <div className="space-y-2">
                {form.geo.map((row) => (
                  <div key={row.id} className="flex items-center gap-2">
                    <select value={row.country} onChange={(e) => updGeo(row.id, { country: e.target.value })} className="input !w-40 shrink-0">
                      <option value="">Country…</option>
                      {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                    </select>
                    <input
                      type="text"
                      value={row.url}
                      onChange={(e) => updGeo(row.id, { url: e.target.value })}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        const clean = sanitizeUrl(pasted);
                        if (clean !== pasted) { e.preventDefault(); updGeo(row.id, { url: clean }); }
                      }}
                      onBlur={(e) => updGeo(row.id, { url: sanitizeUrl(e.target.value) })}
                      className="input flex-1 min-w-0"
                      placeholder="https://…"
                    />
                    <button type="button" onClick={() => rmGeo(row.id)} className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3 cursor-pointer hover:bg-surface-2 transition">
            <input type="checkbox" checked={form.deep_link_enabled} onChange={(e) => setForm({ ...form, deep_link_enabled: e.target.checked })} className="mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> Enable app deep-linking</div>
              <div className="text-[11px] text-muted-foreground">On mobile, try to open the native app before falling back to the web URL.</div>
            </div>
          </label>

          <Field label="Expires at (optional)">
            <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="input" />
          </Field>
        </form>

        <div className="flex gap-2 border-t border-border/60 bg-background/40 px-6 py-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-input bg-surface px-3 py-2.5 text-sm hover:bg-surface-2">Cancel</button>
          <button type="submit" form="new-link-form" disabled={pending} className="flex-1 rounded-lg bg-[image:var(--gradient-neon)] px-3 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] disabled:opacity-60 hover:opacity-90">
            {pending ? "Creating…" : "Create link"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground/70 truncate">{hint}</span>}
    </label>
  );
}
function Badge({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
      {icon}{children}
    </span>
  );
}
