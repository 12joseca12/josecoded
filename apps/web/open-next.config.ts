import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// Prerendered (SSG) pages are served from the ASSETS binding, read-only: no R2, KV or Durable
// Objects, no ISR and no revalidateTag (DT §1.3 and plan v2.1/v2.3).
const config = {
  ...defineCloudflareConfig({
    incrementalCache: staticAssetsIncrementalCache,
  }),
  // `pnpm build` is `opennextjs-cloudflare build`; it runs the plain Next build itself.
  buildCommand: 'pnpm exec next build',
};

export default config;
