import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Link2, QrCode, User2, LogOut, Zap } from "lucide-react";
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
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border/60 bg-surface/30 backdrop-blur-md p-4">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-neon)]"><Zap className="h-4 w-4 text-[color:var(--primary-foreground)]" /></div>
          <span className="font-black tracking-tight">Proforma</span>
        </Link>
        <nav className="flex flex-col gap-1">
          <NavItem to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</NavItem>
          <NavItem to="/links" icon={<Link2 className="h-4 w-4" />}>Smart Links</NavItem>
          <NavItem to="/bio" icon={<QrCode className="h-4 w-4" />}>Bio Page</NavItem>
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <button onClick={signOut} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface hover:text-foreground">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
      activeProps={{ className: "flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-surface text-foreground border border-border shadow-[var(--glow-blue)]" }}
    >
      {icon}{children}
    </Link>
  );
}
