import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/brand-logo";
import { CubeEntrance } from "@/components/cube-entrance";
import { AuthForm } from "@/components/auth-form";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — DevMatrix" },
      { name: "description", content: "Sign in to your DevMatrix dashboard." },
      { property: "og:title", content: "Sign in — DevMatrix" },
      { property: "og:description", content: "Access your smart links, QR codes and bio pages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col px-4">
      <div className="mx-auto w-full max-w-6xl py-6">
        <Link to="/"><BrandMark /></Link>
      </div>
      <div className="flex flex-1 items-center justify-center pb-16">
        <CubeEntrance>
          <AuthForm />
        </CubeEntrance>
      </div>
    </div>
  );
}
