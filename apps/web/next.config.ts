import createMDX from '@next/mdx';
import createNextIntlPlugin from 'next-intl/plugin';
import { createCssVariablesTheme } from 'shiki';

import { pathnames } from './i18n/pathnames';
import { buildLocaleRules } from './i18n/route-rules';
import { PREVIEW_HEADERS, STATIC_SECURITY_HEADERS } from './lib/security/headers';

import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
// Guides (`content/blog/<locale>/<slug>.mdx`) are compiled at build when a page imports them, so the worker carries no MDX
// compiler. Plugins go by name: Turbopack cannot receive functions. The YAML frontmatter is validated by
// scripts/content-index.ts and only stripped here.
// Code is highlighted at build (shiki through rehype-pretty-code) with the CSS-variables theme: tokens carry
// `var(--shiki-token-*)`, which prose.module.css maps to the palette, so no colour is written here. Headings get an
// id (rehype-slug) and are wrapped in a link to themselves (rehype-autolink-headings), in that order.
const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-frontmatter', 'remark-gfm'],
    rehypePlugins: [
      'rehype-slug',
      ['rehype-autolink-headings', { behavior: 'wrap', properties: { 'data-heading-link': '' } }],
      ['rehype-pretty-code', { theme: createCssVariablesTheme({ name: 'josecoded', variablePrefix: '--shiki-' }), keepBackground: false }],
    ],
  },
});
const { rewrites, redirects } = buildLocaleRules(pathnames);

const config: NextConfig = {
  // workspace packages are shipped as TypeScript source
  transpilePackages: ['@josecoded/types', '@josecoded/pricing', '@josecoded/glyph-scene'],
  // no image optimizer in the worker: images are generated at build time (task 2.x)
  images: { unoptimized: true },
  // do not advertise the framework
  poweredByHeader: false,
  // next dev must not write AGENTS.md / CLAUDE.md into the app
  agentRules: false,
  // the CSV import (K4) sends the file text (≤ 1 MB, checked again in the action) in the body of a Server Action
  experimental: { serverActions: { bodySizeLimit: '2mb' } },

  // trailing slashes are redirected by our own rules (one hop to the canonical URL)
  skipTrailingSlashRedirect: true,
  // i18n without middleware/proxy (DT §1.4): rewrites and redirects derived from `pathnames`
  async rewrites() {
    return { beforeFiles: rewrites, afterFiles: [], fallback: [] };
  },
  async redirects() {
    return redirects;
  },
  // Security headers on everything Next serves (the assets binding serves public/_headers; the CSP is added per HTML
  // response by worker.ts, see lib/security). A preview (`*.workers.dev`) is never indexed: its build says so on every
  // response, and also in its robots.txt and meta tags (lib/seo). Production builds send no X-Robots-Tag.
  async headers() {
    const headers = [...STATIC_SECURITY_HEADERS, ...(process.env.NEXT_PUBLIC_SITE_ENV === 'preview' ? PREVIEW_HEADERS : [])];
    return [{ source: '/:path*', headers: headers.map(({ key, value }) => ({ key, value })) }];
  },
};

export default withMDX(withNextIntl(config));
