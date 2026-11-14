import type { ProjectMeta } from "./schemas";
export const projectMetas: { slug: string; meta: ProjectMeta }[] = [
  {
    slug: "3cat",
    meta: {
      title: "3Cat",
      slug: "3cat",
      kind: "app",
      status: "live",
      headline: "La app principal de 3Cat: funcionalidades en React Native dentro de un equipo.",
      description:
        "Caso 3Cat: desarrollo de funcionalidades en la app principal de 3Cat, la radiotelevisión pública catalana, en React Native. Trabajo en equipo vía Alten.",
      role: "Desarrollador React Native en el equipo de 3Cat, vía Alten",
      period: "Abr 2024 – actualidad",
      sector: "Medios de comunicación",
      team: true,
      stack: ["React Native", "TypeScript", "iOS", "Android"],
      links: {},
      relatedService: "freelance",
      featured: false,
      order: 2,
    },
  },
  {
    slug: "3catinfo",
    meta: {
      title: "3CatInfo",
      slug: "3catinfo",
      kind: "app",
      status: "live",
      headline:
        "La app de noticias de 3Cat, con la IA integrada en el producto y la accesibilidad como requisito.",
      description:
        "Caso 3CatInfo: app de noticias de 3Cat en React Native. Integración de IA en el producto y accesibilidad WCAG, en el equipo vía Alten.",
      role: "Desarrollador React Native en el equipo de 3Cat, vía Alten",
      period: "Abr 2024 – actualidad",
      sector: "Medios de comunicación",
      team: true,
      stack: ["React Native", "TypeScript", "iOS", "Android", "Accesibilidad (WCAG)"],
      links: {},
      relatedService: "freelance",
      featured: true,
      order: 1,
    },
  },
  {
    slug: "josecoded",
    meta: {
      title: "josecoded",
      slug: "josecoded",
      kind: "web",
      status: "wip",
      headline:
        "Esta web: mi escaparate y mi forma de trabajar, hecha de cero y con la calidad medida.",
      description:
        "Caso josecoded: mi web personal en Next 16 sobre Cloudflare Workers, con CSP con nonce, accesibilidad WCAG 2.2 AA y presupuesto de JS medido.",
      role: "Diseño y desarrollo de principio a fin",
      period: "2026 – actualidad",
      sector: "Web personal",
      team: false,
      stack: ["Next.js", "TypeScript", "Cloudflare Workers", "Supabase"],
      links: {},
      metric: {
        label: "de JavaScript comprimido en la home, con un presupuesto de 150 KB",
        value: "145 KB",
        source: "pnpm perf:budget sobre la build de esta web",
        date: "2026-11-05",
      },
      relatedService: "a-medida",
      featured: true,
      order: 4,
    },
  },
  {
    slug: "nextraket",
    meta: {
      title: "NextRaket",
      slug: "nextraket",
      kind: "web",
      status: "live",
      headline:
        "Mi trabajo freelance: apps con React Native y webs con Next.js, de los requisitos al mantenimiento.",
      description:
        "Caso NextRaket: mi trabajo freelance para diversas empresas. Apps con React Native, webs con Next.js y Supabase, y automatización con n8n.",
      role: "Desarrollo full-stack freelance, de principio a fin",
      period: "2024 – actualidad",
      sector: "Negocios locales y empresas",
      team: false,
      stack: ["React Native", "Expo", "Next.js", "Supabase", "Firebase", "n8n"],
      links: {},
      relatedService: "a-medida",
      featured: false,
      order: 3,
    },
  },
];
