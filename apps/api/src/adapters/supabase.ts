// Real adapter of the Supabase project (DATOS §8, §9; working-agreements §17.1). With scheduled-jobs.ts and
// outbox.ts it is all the gateway knows about Supabase, and it is the only file that imports supabase-js
// (lint-enforced). It replaces services/supabase.service.ts: no superuser by email, admin = a row of
// `public.staff_members` read with the secret key.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { RpcClient } from './scheduled-jobs';
import type { Env } from '../types/env.types';
import type { AuthUser, Database } from '@josecoded/types';

export type StaffRole = 'admin' | 'closer';

// `database.ts` predates migration 20261101100100 (`staff_members.disabled_at`): until it is regenerated on the Mac
// (`pnpm --filter @josecoded/types db:types`) the column name is cast to a known one for the query builder only.
const DISABLED_AT = 'disabled_at' as 'role';

export interface SupabaseGateway {
  /** The user of a browser JWT, or `null` when Auth rejects it. Throws when Auth cannot be reached. */
  verifyUser(jwt: string): Promise<AuthUser | null>;
  /** Whether `userId` has an active (`disabled_at is null`) `admin` row in `public.staff_members`. Needs `SUPABASE_SECRET_KEY`. */
  isAdmin(userId: string): Promise<boolean>;
  /** The role of an active staff member (`admin` or `closer`), `null` for anyone else, a deactivated closer included. */
  staffRole(userId: string): Promise<StaffRole | null>;
  /** Service client (secret key, bypasses RLS). Throws without `SUPABASE_SECRET_KEY`. */
  admin(): SupabaseClient<Database>;
}

export type SupabaseAdapters = {
  gateway: SupabaseGateway;
  /** RPCs with the secret key (outbox, scheduled jobs); `undefined` without `SUPABASE_SECRET_KEY`. */
  rpc?: RpcClient;
};

/** Publishable key for the `apikey` header (`sb_publishable_…`, or the legacy anon JWT). */
function publicKey(env: Env): string {
  const key = env.SUPABASE_PUBLISHABLE_KEY?.trim() || env.SUPABASE_ANON_KEY?.trim();
  if (!key) throw new Error('SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY) is required');
  return key;
}

/**
 * Reads `aal` from the JWT payload. Only called after `/auth/v1/user` accepted the token, so its claims are the
 * ones Auth signed; a payload that does not decode just yields `null` (no second factor known).
 */
function aalOf(jwt: string): AuthUser['aal'] {
  const segment = jwt.split('.')[1];
  if (!segment) return null;
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='))) as {
      aal?: unknown;
    };
    return json.aal === 'aal1' || json.aal === 'aal2' ? json.aal : null;
  } catch {
    return null;
  }
}

function createServiceClient(base: string, secret: string, fetchImpl: typeof fetch): SupabaseClient<Database> {
  return createClient<Database>(base, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (...args) => fetchImpl(...args) },
  });
}

/**
 * Builds the adapters of one request. The service client is created on first use: most requests (health,
 * public routes) never need it.
 */
export function createSupabaseAdapters(env: Env, fetchImpl: typeof fetch = fetch): SupabaseAdapters {
  const base = env.SUPABASE_URL.replace(/\/$/, '');
  const secret = env.SUPABASE_SECRET_KEY?.trim();
  let client: SupabaseClient<Database> | undefined;
  const service = () => {
    if (!secret) throw new Error('SUPABASE_SECRET_KEY is required');
    client ??= createServiceClient(base, secret, fetchImpl);
    return client;
  };

  const gateway: SupabaseGateway = {
    async verifyUser(jwt) {
      // A direct fetch, as the legacy gateway did: more predictable on Workers than supabase-js getUser.
      const res = await fetchImpl(`${base}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${jwt}`, apikey: publicKey(env) },
      });
      // 4xx: the token is not a session (expired, malformed, revoked); 429 and 5xx: Auth is not answering
      if (res.status >= 400 && res.status < 500 && res.status !== 429) return null;
      if (!res.ok) throw new Error(`supabase auth: ${res.status}`);
      const user = (await res.json()) as { id?: unknown; email?: unknown };
      if (typeof user.id !== 'string' || !user.id) return null;
      return { id: user.id, email: typeof user.email === 'string' ? user.email : null, aal: aalOf(jwt) };
    },
    async isAdmin(userId) {
      const { data, error } = await service()
        .from('staff_members')
        .select('user_id')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .is(DISABLED_AT, null)
        .limit(1);
      if (error) throw new Error(`staff_members: ${error.message}`);
      return Array.isArray(data) && data.length > 0;
    },
    async staffRole(userId) {
      const { data, error } = await service()
        .from('staff_members')
        .select('role')
        .eq('user_id', userId)
        .is(DISABLED_AT, null)
        .limit(1);
      if (error) throw new Error(`staff_members: ${error.message}`);
      const role: unknown = Array.isArray(data) ? data[0]?.role : undefined;
      return role === 'admin' || role === 'closer' ? role : null;
    },
    admin: service,
  };

  return {
    gateway,
    ...(secret ? { rpc: { rpc: (fn, args) => service().rpc(fn, args) } } : {}),
  };
}
