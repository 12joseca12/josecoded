// Entry of the Worker: OpenNext's worker plus the Content-Security-Policy of each HTML response (lib/security). OpenNext
// documents this "custom worker" shape and `wrangler.jsonc` points `main` here. It is plain JavaScript on purpose: wrangler
// bundles it with esbuild, while TypeScript and typed lint never have to load OpenNext's multi-megabyte output.
// The Durable Object exports are required by OpenNext's build even if this deployment binds none.
import openNext from './.open-next/worker.js';
import csp from './content/generated/csp-config.json' with { type: 'json' };
import { withCsp } from './lib/security/with-csp.ts';

export { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';

const worker = {
  /** @param {Request} request @param {unknown} env @param {{ waitUntil(promise: Promise<unknown>): void }} ctx */
  async fetch(request, env, ctx) {
    return withCsp(await openNext.fetch(request, env, ctx), csp);
  },
};

export default worker;
