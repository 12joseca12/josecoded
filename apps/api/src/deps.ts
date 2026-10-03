// Composition root of the NEW gateway modules (working-agreements §17.1).
// Ports live in @josecoded/types (api.ts); real adapters live in src/adapters/ and are the only files
// that import SDKs or call third parties. Routes receive `c.var.deps`; they never import adapters.
// The legacy modules (v1, v1-protected, forum, admin-chat, health, system) do not use this.
import type { Env } from './types/env.types';
import type { Clock } from '@josecoded/types';

export interface Deps {
  clock: Clock;
}

/** Hono generics of the gateway app: the bindings plus what the middlewares leave in `c.var`. */
export type AppEnv = {
  Bindings: Env;
  Variables: { deps: Deps };
};

/**
 * Builds the real dependencies once per request. Each adapter added by a later task goes here.
 * The clock is trivial enough to live inline until a second adapter justifies the folder.
 */
export function buildDeps(env: Env): Deps {
  void env;
  return {
    clock: { now: () => new Date() },
  };
}
