import type { BlogMeta, LegalMeta, ProjectMeta } from "./schemas";
import type { ContentEntry } from "./types";
export const projects: ContentEntry<ProjectMeta>[] = [
  {
    slug: "app-ejemplo",
    meta: {
      title: "App de ejemplo",
      slug: "app-ejemplo",
      summary: "{{DATO: resumen de una línea del primer proyecto}}",
      role: "Diseño y desarrollo de principio a fin",
      stack: ["Next.js", "Supabase", "Cloudflare"],
      year: 2026,
      links: [{ label: "Ver en la tienda", href: "{{DATO: enlace a la tienda de aplicaciones}}" }],
      cover: {
        src: "{{DATO: ruta de la portada}}",
        alt: "Captura de la pantalla principal de la app",
      },
      featured: true,
      order: 1,
      status: "live",
    },
    load: () => import("../../content/projects/app-ejemplo.mdx"),
  },
  {
    slug: "web-ejemplo",
    meta: {
      title: "Web de ejemplo",
      slug: "web-ejemplo",
      summary: "{{DATO: resumen de una línea del segundo proyecto}}",
      role: "Desarrollo web y despliegue",
      stack: ["Next.js", "TypeScript", "Cloudflare Workers"],
      year: 2025,
      links: [{ label: "Visitar la web", href: "{{DATO: enlace al sitio en producción}}" }],
      featured: false,
      order: 2,
      status: "wip",
    },
    load: () => import("../../content/projects/web-ejemplo.mdx"),
  },
];
export const blog: ContentEntry<BlogMeta>[] = [];
export const legal: ContentEntry<LegalMeta>[] = [
  {
    slug: "aviso-legal",
    meta: { title: "Aviso legal", updated: "2026-11-02" },
    load: () => import("../../content/legal/aviso-legal.mdx"),
  },
];
