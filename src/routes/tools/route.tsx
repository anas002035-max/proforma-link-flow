import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tools")({
  component: ToolsLayout,
});

function ToolsLayout() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 md:px-8">
          <Link to="/"><BrandMark /></Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/dashboard" className="rounded-lg border border-border bg-surface/60 px-3 py-1.5 text-xs font-semibold hover:bg-surface">
              {t("nav.dashboard")}
            </Link>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
