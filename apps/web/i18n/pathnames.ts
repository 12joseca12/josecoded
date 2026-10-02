// Single source of the localized URLs. Keys are the Spanish (canonical, folder) paths; English
// slugs are translated (plan v2.3). `next.config.ts` derives rewrites and redirects from this
// object and `routing.ts` hands it to next-intl, so the three never drift.
// Task 2.1 adds the client-area, auth and profile routes (UX v4.0 §2.1–2.2).
export const pathnames = {
  '/': '/',
  '/empresas': { es: '/empresas', en: '/companies' },
  '/negocios': { es: '/negocios', en: '/business' },
  '/propuesta': { es: '/propuesta', en: '/proposal' },
  '/proyectos': { es: '/proyectos', en: '/projects' },
  '/sobre-mi': { es: '/sobre-mi', en: '/about' },
  '/contacto': { es: '/contacto', en: '/contact' },
  '/blog': '/blog',
  '/chat': '/chat',
  '/legal/aviso-legal': { es: '/legal/aviso-legal', en: '/legal/notice' },
  '/legal/privacidad': { es: '/legal/privacidad', en: '/legal/privacy' },
  '/legal/cookies': '/legal/cookies',
} as const;

export type Pathnames = Readonly<Record<string, string | { es: string; en: string }>>;
