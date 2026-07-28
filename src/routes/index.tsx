import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-logo";
import { CubeEntrance } from "@/components/cube-entrance";
import { AuthForm } from "@/components/auth-form";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevMatrix — Smart Links, Dynamic QR & Link-in-Bio" },
      {
        name: "description",
        content:
          "One cinematic workspace for smart links, geo-targeted routing, dynamic QR codes and link-in-bio pages.",
      },
      { property: "og:title", content: "DevMatrix — Route every click the smart way" },
      { property: "og:description", content: "Smart Links, Dynamic QR, and Link-in-Bio in one minimalist workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <BrandMark />
        <Link to="/tools" className="text-sm text-muted-foreground hover:text-foreground">
          Tools
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-16">
        <h1 className="sr-only">DevMatrix — smart links, dynamic QR codes and link-in-bio</h1>
        <CubeEntrance>
          <AuthForm />
        </CubeEntrance>
        <p className="mt-8 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
          Smart links · Dynamic QR · Link-in-bio · 12 engineering utilities
        </p>
      </main>
    </div>
  );
}
