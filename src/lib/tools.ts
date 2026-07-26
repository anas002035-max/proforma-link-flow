import type { LucideIcon } from "lucide-react";
import {
  Waves, Image as ImageIcon, ScrollText, Smartphone, KeyRound, Wind,
  Database, Workflow, Container, BookOpenCheck, Braces, Languages,
} from "lucide-react";

export type Tool = {
  slug: string;
  name: string;
  tagline: string;
  tier: "free" | "pro";
  icon: LucideIcon;
  seoTitle: string;
  seoIntro: string;
  span?: string;
};

export const TOOLS: Tool[] = [
  {
    slug: "svg-animator", name: "SVG Animation Timeline", tier: "free", icon: Waves,
    tagline: "Parse SVG XML, build keyframes on a timeline and export an animated SVG.",
    seoTitle: "Animate SVG files online with a visual keyframe timeline",
    seoIntro: "Upload or paste SVG markup, add keyframes for transform, opacity and colour, and export a self-contained animated SVG with inline @keyframes — no build step, no server upload.",
    span: "md:col-span-2",
  },
  {
    slug: "og-builder", name: "Open Graph Template Builder", tier: "free", icon: ImageIcon,
    tagline: "Compose neon social banners on canvas and export PNG or raw layout code.",
    seoTitle: "Design Open Graph and Twitter card images in the browser",
    seoIntro: "Position headline, subtitle and accent layers over a gradient canvas, preview at 1200×630, and export the banner as PNG via canvas.toDataURL or copy the layout markup.",
  },
  {
    slug: "log-parser", name: "Server Log Parser", tier: "free", icon: ScrollText,
    tagline: "Web Worker powered Apache/Nginx log analysis with status-code charts.",
    seoTitle: "Analyse Apache and Nginx access logs without uploading them",
    seoIntro: "A Web Worker streams your log file off the main thread, extracts status codes, paths and timestamps with optimised regex, and renders aggregated charts. Files stay on your machine.",
    span: "md:col-span-2",
  },
  {
    slug: "screenshot-studio", name: "App Store Screenshot Studio", tier: "free", icon: Smartphone,
    tagline: "Device safe-zone mockups with marketing overlays and canvas export.",
    seoTitle: "Create App Store and Play Store screenshots with safe zones",
    seoIntro: "Drop an app capture into an iOS or Android device frame, add headline overlays inside the store safe zone, and export ready-to-upload marketing screenshots.",
  },
  {
    slug: "jwt-inspector", name: "JWT Debugger & Inspector", tier: "free", icon: KeyRound,
    tagline: "Decode header and payload locally, flag insecure algorithms.",
    seoTitle: "Decode and inspect JSON Web Tokens safely offline",
    seoIntro: "Split a JWT on the dot separator, base64url-decode header and payload, inspect expiry claims, and get a neon security verdict when the token uses the 'none' algorithm or is unsigned.",
  },
  {
    slug: "html-to-tailwind", name: "HTML to Tailwind Converter", tier: "free", icon: Wind,
    tagline: "Map inline styles onto a Tailwind utility dictionary in one pass.",
    seoTitle: "Convert inline CSS and HTML into Tailwind utility classes",
    seoIntro: "Paste legacy markup with style attributes; the client-side compiler dictionary maps each declaration to the closest Tailwind class and returns clean, copyable HTML.",
  },
  {
    slug: "schema-visualizer", name: "Database Schema Visualizer", tier: "pro", icon: Database,
    tagline: "Drag tables, wire relations, compile PostgreSQL or MySQL DDL.",
    seoTitle: "Visually design SQL schemas and export DDL migrations",
    seoIntro: "Lay out tables on an interactive canvas, define columns and keys, connect foreign keys, and compile perfectly formatted PostgreSQL or MySQL migration scripts from the live schema state.",
    span: "md:col-span-2",
  },
  {
    slug: "mock-api", name: "Service Worker Mock API", tier: "pro", icon: Workflow,
    tagline: "Generate a downloadable sw.js that intercepts fetch locally.",
    seoTitle: "Generate a Service Worker mock API for local development",
    seoIntro: "Define routes and JSON payloads, then download a self-contained sw.js that intercepts fetch inside your own browser — no proxy, no backend, no network round trips.",
  },
  {
    slug: "docker-architect", name: "Docker Compose Architect", tier: "pro", icon: Container,
    tagline: "Compose Node, Redis, Nginx and Postgres blocks into ready configs.",
    seoTitle: "Build Dockerfile and docker-compose.yml files visually",
    seoIntro: "Select service blocks, tune ports and environment variables, and the template engine compiles correctly indented Dockerfile and docker-compose.yml output ready for deployment.",
    span: "md:col-span-2",
  },
  {
    slug: "openapi-docs", name: "OpenAPI Static Docs Builder", tier: "pro", icon: BookOpenCheck,
    tagline: "Turn a Swagger spec into a dark-neon interactive docs page.",
    seoTitle: "Render Swagger and OpenAPI specs as a dark themed docs site",
    seoIntro: "Load an OpenAPI JSON specification and the client-side compiler maps paths, parameters, request bodies and auth schemes into an interactive neon documentation layout you can export.",
  },
  {
    slug: "js-deobfuscator", name: "JavaScript Deobfuscator", tier: "pro", icon: Braces,
    tagline: "Decode packed hex strings and re-indent minified bundles.",
    seoTitle: "Deobfuscate and beautify minified JavaScript in the browser",
    seoIntro: "Paste packed or obfuscated JavaScript; the pipeline decodes hex and unicode escapes, unwraps string-array lookups, normalises bracket member access and re-indents the result.",
  },
  {
    slug: "i18n-validator", name: "i18n Schema Validator", tier: "pro", icon: Languages,
    tagline: "Diff locale JSON files for missing keys and empty strings.",
    seoTitle: "Validate translation JSON files for missing or empty keys",
    seoIntro: "Drop several locale files at once; the deep key walker compares every variant against your baseline and reports missing paths, extra keys, type mismatches and empty translations.",
  },
];

export const FREE_TOOLS = TOOLS.filter((t) => t.tier === "free");
export const PRO_TOOLS = TOOLS.filter((t) => t.tier === "pro");
export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug);
