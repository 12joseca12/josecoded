import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// Prerendered (SSG) pages are served from the ASSETS binding, read-only: no R2, KV or Durable
// Objects, no ISR and no revalidateTag (DT §1.3 and plan v2.1/v2.3).
const config = {
  ...defineCloudflareConfig({
    incrementalCache: staticAssetsIncrementalCache,
  }),
  // `pnpm build`, the deploy and the preview all run `opennextjs-cloudflare build`, which runs this command, so
  // build-info.json and content-index.json are regenerated on every build path (content/generated is not versioned).
  buildCommand: 'pnpm run generate && pnpm exec next build',
};

export default config;
