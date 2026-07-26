import { createFileRoute, notFound } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ToolShell } from "@/components/tool-shell";
import { getTool } from "@/lib/tools";

const REGISTRY: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  "svg-animator": lazy(() => import("@/components/tools/svg-animator")),
  "og-builder": lazy(() => import("@/components/tools/og-builder")),
  "log-parser": lazy(() => import("@/components/tools/log-parser")),
  "screenshot-studio": lazy(() => import("@/components/tools/screenshot-studio")),
  "jwt-inspector": lazy(() => import("@/components/tools/jwt-inspector")),
  "html-to-tailwind": lazy(() => import("@/components/tools/html-to-tailwind")),
  "schema-visualizer": lazy(() => import("@/components/tools/schema-visualizer")),
  "mock-api": lazy(() => import("@/components/tools/mock-api")),
  "docker-architect": lazy(() => import("@/components/tools/docker-architect")),
  "openapi-docs": lazy(() => import("@/components/tools/openapi-docs")),
  "js-deobfuscator": lazy(() => import("@/components/tools/js-deobfuscator")),
  "i18n-validator": lazy(() => import("@/components/tools/i18n-validator")),
};

export const Route = createFileRoute("/tools/$slug")({
  beforeLoad: ({ params }) => {
    if (!getTool(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const tool = getTool(params.slug);
    if (!tool) return {};
    return {
      meta: [
        { title: `${tool.name} — Proforma Hub` },
        { name: "description", content: tool.seoIntro.slice(0, 155) },
        { property: "og:title", content: `${tool.name} — Proforma Hub` },
        { property: "og:description", content: tool.seoTitle },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ToolPage,
});

function ToolPage() {
  const { slug } = Route.useParams();
  const tool = getTool(slug);
  if (!tool) return null;
  const Body = REGISTRY[slug];

  return (
    <ToolShell tool={tool}>
      <Suspense fallback={<div className="glass grid h-64 place-items-center text-sm text-muted-foreground">Loading tool…</div>}>
        {Body ? <Body /> : null}
      </Suspense>
    </ToolShell>
  );
}
