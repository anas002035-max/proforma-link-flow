import { LANGS, useI18n, type LangCode } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-2.5 py-1.5 text-xs text-muted-foreground">
      <Globe className="h-3.5 w-3.5 text-[color:var(--neon-blue)]" />
      {!compact && <span className="sr-only">{t("common.language")}</span>}
      <select
        aria-label={t("common.language")}
        value={lang}
        onChange={(e) => setLang(e.target.value as LangCode)}
        className="bg-transparent text-xs text-foreground outline-none [&>option]:bg-[color:var(--popover)]"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
        ))}
      </select>
    </label>
  );
}
