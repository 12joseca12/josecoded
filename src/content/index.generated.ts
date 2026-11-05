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
    headings: [
      { id: "el-problema", label: "El problema" },
      { id: "qué-hice", label: "Qué hice" },
      { id: "resultado", label: "Resultado" },
    ],
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
    headings: [
      { id: "el-problema", label: "El problema" },
      { id: "qué-hice", label: "Qué hice" },
      { id: "resultado", label: "Resultado" },
    ],
    load: () => import("../../content/projects/web-ejemplo.mdx"),
  },
];
export const blog: ContentEntry<BlogMeta>[] = [];
export const legal: ContentEntry<LegalMeta>[] = [
  {
    slug: "aviso-legal",
    meta: {
      title: "Aviso legal",
      updated: "2026-11-05",
      draft: false,
      summary: [
        "Este sitio lo edita y mantiene una persona física, José Carlos Sánchez García, desde Madrid (España).",
        "Puedes escribirme a hola@josecoded.com para cualquier asunto legal o de contenido.",
        "El acceso es gratuito y la información tiene carácter orientativo, no es una oferta vinculante.",
        "Los contenidos son propiedad del titular y no se pueden reutilizar sin permiso.",
        "Cómo trato tus datos y qué cookies uso está explicado en sus páginas propias.",
      ],
    },
    headings: [
      { id: "titular-del-sitio", label: "Titular del sitio" },
      { id: "objeto-del-sitio", label: "Objeto del sitio" },
      { id: "condiciones-de-uso", label: "Condiciones de uso" },
      {
        id: "carácter-orientativo-de-la-información",
        label: "Carácter orientativo de la información",
      },
      { id: "propiedad-intelectual-e-industrial", label: "Propiedad intelectual e industrial" },
      { id: "enlaces", label: "Enlaces" },
      { id: "responsabilidad", label: "Responsabilidad" },
      { id: "protección-de-datos-y-cookies", label: "Protección de datos y cookies" },
      { id: "legislación-aplicable-y-jurisdicción", label: "Legislación aplicable y jurisdicción" },
    ],
    load: () => import("../../content/legal/aviso-legal.mdx"),
  },
  {
    slug: "cookies",
    meta: {
      title: "Política de cookies",
      updated: "2026-11-05",
      draft: false,
      summary: [
        "Solo uso cookies estrictamente necesarias, así que no hay banner que aceptar.",
        "Sirven para mantener tu sesión si entras y para recordar tu conversación con el asistente del chat si le escribes.",
        "No uso cookies de analítica, publicidad ni seguimiento.",
        "Si algún día las añado, te pediré consentimiento antes de activarlas.",
        "Puedes borrarlas desde tu navegador cuando quieras; el sitio seguirá funcionando.",
      ],
    },
    headings: [
      { id: "solo-cookies-necesarias", label: "Solo cookies necesarias" },
      { id: "qué-cookies-se-usan", label: "Qué cookies se usan" },
      { id: "cómo-gestionar-o-borrar-las-cookies", label: "Cómo gestionar o borrar las cookies" },
      { id: "cambios", label: "Cambios" },
      { id: "más-información", label: "Más información" },
    ],
    load: () => import("../../content/legal/cookies.mdx"),
  },
  {
    slug: "privacidad",
    meta: {
      title: "Política de privacidad",
      updated: "2026-11-05",
      draft: false,
      summary: [
        "Guardo solo lo que me das: el formulario de contacto, el chat y, si entras, tu cuenta. No hay publicidad ni analítica.",
        "Lo uso para responderte y, si llega a haber trabajo, para gestionarlo; nada más.",
        "Un chat sin datos de contacto se borra a los 7 días; si dejas tu contacto, a los 60 días; si eres cliente, a los 90 días desde tu última respuesta.",
        "Intervienen proveedores con contrato de encargo de tratamiento, casi todos en la Unión Europea (lista abajo).",
        "Para acceder, corregir o borrar tus datos escribe a hola@josecoded.com.",
      ],
    },
    headings: [
      { id: "responsable-del-tratamiento", label: "Responsable del tratamiento" },
      { id: "qué-datos-trato-y-para-qué", label: "Qué datos trato y para qué" },
      { id: "cómo-se-trata-el-chat", label: "Cómo se trata el chat" },
      { id: "cuánto-tiempo-conservo-tus-datos", label: "Cuánto tiempo conservo tus datos" },
      { id: "quién-más-accede-a-tus-datos", label: "Quién más accede a tus datos" },
      { id: "transferencias-internacionales", label: "Transferencias internacionales" },
      { id: "seguridad", label: "Seguridad" },
      { id: "tus-derechos", label: "Tus derechos" },
      { id: "cambios-en-esta-política", label: "Cambios en esta política" },
    ],
    load: () => import("../../content/legal/privacidad.mdx"),
  },
];
