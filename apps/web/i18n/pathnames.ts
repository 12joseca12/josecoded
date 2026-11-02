// Single source of the localized URLs. Keys are the Spanish (canonical, folder) paths; English
// slugs are translated (plan v2.3). `next.config.ts` derives rewrites and redirects from this
// object and `routing.ts` hands it to next-intl, so the three never drift.
// UX v4.0 §2.1–2.2 and pantallas v2.0 §1 (P20 `/servicios`, P21 `/partners`, P22 `/lab`).
// Dynamic screens are listed with their template (`/proyectos/[slug]`) so that `Link` and
// `getPathname` accept `{ pathname, params }`. They add no rewrites: `route-rules.ts` skips keys
// with `[` because the translated parent prefix already rewrites every child.
// Admin screens (`/admin/...`, noindex, Spanish only) are outside this map on purpose.
export const pathnames = {
  '/': '/',
  '/servicios': { es: '/servicios', en: '/services' },
  '/partners': '/partners',
  '/propuesta': { es: '/propuesta', en: '/proposal' },
  '/proyectos': { es: '/proyectos', en: '/projects' },
  '/sobre-mi': { es: '/sobre-mi', en: '/about' },
  '/contacto': { es: '/contacto', en: '/contact' },
  '/proyectos/[slug]': { es: '/proyectos/[slug]', en: '/projects/[slug]' },
  '/blog': '/blog',
  '/blog/[slug]': '/blog/[slug]',
  '/lab': '/lab',
  '/lab/[slug]': '/lab/[slug]',
  '/chat': '/chat',
  '/legal/aviso-legal': { es: '/legal/aviso-legal', en: '/legal/notice' },
  '/legal/privacidad': { es: '/legal/privacidad', en: '/legal/privacy' },
  '/legal/cookies': '/legal/cookies',
  '/auth/login': '/auth/login',
  '/auth/registro': { es: '/auth/registro', en: '/auth/sign-up' },
  '/auth/codigo': { es: '/auth/codigo', en: '/auth/code' },
  '/auth/callback': '/auth/callback',
  '/auth/oauth': '/auth/oauth',
  '/perfil': { es: '/perfil', en: '/profile' },
  '/area-clientes': { es: '/area-clientes', en: '/client-area' },
  '/area-clientes/tareas': { es: '/area-clientes/tareas', en: '/client-area/tasks' },
  '/area-clientes/tareas/[id]': {
    es: '/area-clientes/tareas/[id]',
    en: '/client-area/tasks/[id]',
  },
  '/area-clientes/material': { es: '/area-clientes/material', en: '/client-area/files' },
  // route handler (GET, signed download); the Spanish child segment is kept in English so the translated parent rewrites it
  '/area-clientes/material/descargar': {
    es: '/area-clientes/material/descargar',
    en: '/client-area/files/descargar',
  },
  '/area-clientes/pack': { es: '/area-clientes/pack', en: '/client-area/plan' },
  '/area-clientes/pack/ampliar': {
    es: '/area-clientes/pack/ampliar',
    en: '/client-area/plan/upgrade',
  },
  '/area-clientes/recomiendame': {
    es: '/area-clientes/recomiendame',
    en: '/client-area/referrals',
  },
} as const;

export type Pathnames = Readonly<Record<string, string | { es: string; en: string }>>;

/** A page that no longer exists: it answers 301 to its successor (pantallas v2.0 §1, P1 and P4). */
export interface RetiredPath {
  /** Former Spanish path and former English path. */
  from: { es: string; en: string };
  /** Successor, per locale, anchor included. */
  to: { es: string; en: string };
}

export const retiredPaths: readonly RetiredPath[] = [
  {
    from: { es: '/negocios', en: '/business' },
    to: { es: '/servicios#packs', en: '/services#packs' },
  },
  {
    from: { es: '/empresas', en: '/companies' },
    to: { es: '/servicios#por-hora', en: '/services#hourly' },
  },
];

/** Bare paths that were never a page: they land on the real entry (UX v4.0 §2.1). */
export const aliasPaths: Readonly<Record<string, string>> = {
  '/auth': '/auth/login',
};
