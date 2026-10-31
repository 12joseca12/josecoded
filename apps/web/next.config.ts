import createNextIntlPlugin from 'next-intl/plugin';

import { pathnames } from './i18n/pathnames';
import { buildLocaleRules } from './i18n/route-rules';

import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
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

  // trailing slashes are redirected by our own rules (one hop to the canonical URL)
  skipTrailingSlashRedirect: true,
  // i18n without middleware/proxy (DT §1.4): rewrites and redirects derived from `pathnames`
  async rewrites() {
    return { beforeFiles: rewrites, afterFiles: [], fallback: [] };
  },
  async redirects() {
    return redirects;
  },
};

export default withNextIntl(config);
