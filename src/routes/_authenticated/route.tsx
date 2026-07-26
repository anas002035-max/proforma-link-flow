import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Link2, QrCode, LogOut, UserSquare2, CreditCard, BarChart3 } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BrandMark } from "@/components/brand-logo";
import { SupportWidget } from "@/components/support-widget";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { queryClient } = Route.useRouteContext();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-5 md:flex">
        <Link to="/dashboard" className="mb-8 block">
          <BrandMark />
        </Link>

        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{t("nav.core")}</div>
        <nav className="flex flex-col gap-1">
          <NavItem to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>{t("nav.dashboard")}</NavItem>
          <NavItem to="/links" icon={<Link2 className="h-4 w-4" />}>Smart Links</NavItem>
          <NavItem to="/qr" icon={<QrCode className="h-4 w-4" />}>QR Codes</NavItem>
          <NavItem to="/bio" icon={<UserSquare2 className="h-4 w-4" />}>Bio Page</NavItem>
        </nav>

        <div className="mt-7 mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{t("nav.account")}</div>
        <nav className="flex flex-col gap-1">
          <NavItem to="/analytics" icon={<BarChart3 className="h-4 w-4" />}>{t("nav.analytics")}</NavItem>
          <NavItem to="/billing" icon={<CreditCard className="h-4 w-4" />}>{t("nav.billing")}</NavItem>
        </nav>

        <div className="mt-7"><LanguageSwitcher /></div>

        <div className="mt-auto space-y-3 pt-6">
          <SupportWidget />
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground">
            <LogOut className="h-4 w-4" /> {t("nav.signout")}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 md:pl-64">
        <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3 md:hidden">
          <Link to="/dashboard"><BrandMark /></Link>
          <button onClick={signOut} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">Sign out</button>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 md:hidden">
          <NavItem to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</NavItem>
          <NavItem to="/links" icon={<Link2 className="h-4 w-4" />}>Links</NavItem>
          <NavItem to="/qr" icon={<QrCode className="h-4 w-4" />}>QR</NavItem>
          <NavItem to="/bio" icon={<UserSquare2 className="h-4 w-4" />}>Bio</NavItem>
        </nav>
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      activeProps={{ className: "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium bg-[color:var(--primary)]/[0.07] text-[color:var(--primary)]" }}
    >
      {icon}{children}
    </Link>
  );
}
