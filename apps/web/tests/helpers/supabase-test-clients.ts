// Clients for the RLS tests against Supabase LOCAL (`supabase start`, seed from supabase/seed/seed.sql).
// URL and keys come from the environment or, by default, from the public values `supabase start` prints for every
// local stack. Never production: the helper refuses any URL that is not a loopback host.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const LOCAL_URL = process.env.SUPABASE_LOCAL ?? 'http://127.0.0.1:54321';
// Public defaults of the Supabase CLI for local stacks (not secrets); override with the keys of `supabase status`.
const LOCAL_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const LOCAL_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);
if (!LOOPBACK.has(new URL(LOCAL_URL).hostname)) {
  throw new Error(`RLS tests only run against a local Supabase (got ${LOCAL_URL})`);
}

export const TEST_PASSWORD = 'test-password-123';

/** Fixed ids of supabase/seed/seed.sql. */
export const SEED = {
  users: {
    jose: '00000000-0000-4000-8000-0000000000a1',
    ana: '00000000-0000-4000-8000-0000000000a2',
    bob: '00000000-0000-4000-8000-0000000000a3',
    sin: '00000000-0000-4000-8000-0000000000a4',
  },
  affiliates: {
    ana: '00000000-0000-4000-8000-0000000000e1',
    bob: '00000000-0000-4000-8000-0000000000e2',
  },
  /** Ana's closed lead (P2) and the lead referred by Ana. */
  leads: {
    ana: '00000000-0000-4000-8000-0000000000b3',
    referredByAna: '00000000-0000-4000-8000-0000000000b1',
  },
  clients: {
    ana: '00000000-0000-4000-8000-0000000000c1',
    invitedSin: '00000000-0000-4000-8000-0000000000c2',
  },
} as const;

export type TestUserName = 'jose' | 'ana' | 'bob' | 'sin';
export type TestClientName = TestUserName | 'anon';

export type TestClient = SupabaseClient & {
  userId: string | null;
  affiliateId: string | null;
  leadId: string | null;
  clientId: string | null;
};

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

/** Service role: only for test setup (never exposed to the code under test). */
export function serviceClient(): SupabaseClient {
  return createClient(LOCAL_URL, LOCAL_SECRET_KEY, options);
}

export async function supabaseIsUp(): Promise<boolean> {
  try {
    const res = await fetch(`${LOCAL_URL}/auth/v1/health`, { signal: AbortSignal.timeout(1500) });
    return res.status < 500;
  } catch {
    return false;
  }
}

function withIds(client: SupabaseClient, name: TestClientName): TestClient {
  const isUser = name !== 'anon';
  return Object.assign(client, {
    userId: isUser ? SEED.users[name] : null,
    affiliateId: name === 'ana' || name === 'bob' ? SEED.affiliates[name] : null,
    leadId: name === 'ana' ? SEED.leads.ana : null,
    clientId: name === 'ana' ? SEED.clients.ana : null,
  });
}

/**
 * Logs in by password as one of the seeded accounts (`<name>@test`). `sin@test` is seeded unconfirmed and GoTrue
 * refuses the login of an unconfirmed email, so it is confirmed just for the login and unconfirmed again right
 * after: the access token stays valid while the database sees the email as unconfirmed, which is what the RPCs check.
 */
export async function clientFor(name: TestClientName): Promise<TestClient> {
  const client = createClient(LOCAL_URL, LOCAL_PUBLISHABLE_KEY, options);
  if (name === 'anon') return withIds(client, name);

  const service = name === 'sin' ? serviceClient() : null;
  if (service) await service.rpc('test_set_email_confirmed', { p_email: 'sin@test', p_confirmed: true });
  try {
    const { error } = await client.auth.signInWithPassword({ email: `${name}@test`, password: TEST_PASSWORD });
    if (error) throw new Error(`login ${name}@test failed: ${error.message}`);
  } finally {
    if (service) await service.rpc('test_set_email_confirmed', { p_email: 'sin@test', p_confirmed: false });
  }
  return withIds(client, name);
}
