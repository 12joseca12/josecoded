import type { Pathnames } from './pathnames';

// Rewrites and redirects of DT §1.4, with translated English slugs (plan v2.3), built from the
// pathnames. Plain data on purpose: it is imported by next.config.ts (no Node middleware).

export interface RewriteRule {
  source: string;
  destination: string;
}

export interface RedirectRule extends RewriteRule {
  permanent: true;
}

// Spanish has no prefix: everything that is not /en, /api, /_next or a file goes to /es.
// One rule per depth, never a single `:path(.*)` param: a destination param that contains
// slashes is encoded by OpenNext on workerd and the request ends in a 500 (/negocios/x, /a/b/c).
const FIRST_SEGMENT = ':first((?!(?:en|api|_next)(?:/|$))[^/.]+)';

/**
 * A path and everything below it. Two explicit rules instead of `:path*`: OpenNext on workerd
 * leaves a literal `:path*` in the destination when the optional segment is empty
 * (/en/business -> /en/business/:path*), so the bare path and the subpaths (`:path+`) are
 * separate rules.
 */
function withSubpaths(from: string, to: string): RewriteRule[] {
  const root = to === '/' ? '' : to;
  return [
    { source: from, destination: to },
    { source: `${from}/:path+`, destination: `${root}/:path+` },
  ];
}

export function buildLocaleRules(pathnames: Pathnames): {
  rewrites: RewriteRule[];
  redirects: RedirectRule[];
} {
  // longer translated paths first, so /legal/notice is matched before any shorter prefix
  const translated = Object.entries(pathnames)
    .flatMap(([, value]) => (typeof value === 'string' || value.es === value.en ? [] : [value]))
    .sort((a, b) => b.en.length - a.en.length);

  const rewrites: RewriteRule[] = [
    // /en/business/... is served by the Spanish-named folder /en/negocios/...
    ...translated.flatMap(({ es, en }) => withSubpaths(`/en${en}`, `/en${es}`)),
    { source: '/', destination: '/es' },
    { source: `/${FIRST_SEGMENT}`, destination: '/es/:first' },
    { source: `/${FIRST_SEGMENT}/:rest+`, destination: '/es/:first/:rest+' },
  ];

  const permanent = <T extends RewriteRule>(rules: T[]) =>
    rules.map((rule) => ({ ...rule, permanent: true as const }));

  // Trailing slashes are handled here (next.config sets skipTrailingSlashRedirect) so that each
  // URL reaches its canonical form in ONE hop: `/es/` -> `/`, `/en/negocios/` -> `/en/business`.
  const redirects: RedirectRule[] = [
    ...permanent([
      { source: '/es/', destination: '/' },
      { source: '/es/:path+/', destination: '/:path+' },
    ]),
    ...translated.flatMap(({ es, en }) =>
      permanent([
        { source: `/en${es}/`, destination: `/en${en}` },
        { source: `/en${es}/:path+/`, destination: `/en${en}/:path+` },
      ]),
    ),
    // one canonical Spanish URL: /es/negocios -> /negocios
    ...permanent(withSubpaths('/es', '/')),
    // the untranslated English variant redirects: /en/negocios -> /en/business (no duplicates)
    ...translated.flatMap(({ es, en }) => permanent(withSubpaths(`/en${es}`, `/en${en}`))),
    // any other trailing slash: /negocios/ -> /negocios, /en/ -> /en
    ...permanent([{ source: '/:path+/', destination: '/:path+' }]),
  ];

  return { rewrites, redirects };
}
