// Clients for the RLS tests against Supabase LOCAL (`supabase start`, seed from supabase/seed/seed.sql).
// URL and keys come from the environment or, by default, from the public values `supabase start` prints for every
// local stack. Never production: the helper refuses any URL that is not a loopback host.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { totp } from './totp';

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

/** Fixed ids of supabase/seed/seed.sql (tasks 1.8a and 1.8b; the seed header documents the ranges). */
export const SEED = {
  users: {
    jose: '00000000-0000-4000-8000-0000000000a1',
    ana: '00000000-0000-4000-8000-0000000000a2',
    bob: '00000000-0000-4000-8000-0000000000a3',
    sin: '00000000-0000-4000-8000-0000000000a4',
    /** Closer, active, 10 % commission (task 1.8e). */
    carla: '00000000-0000-4000-8000-0000000000a5',
    /** Closer switched off (disabled_at set), 15 %, still owns a contact. */
    dani: '00000000-0000-4000-8000-0000000000a6',
  },
  orgs: {
    agenciaTest: '00000000-0000-4000-8000-000000000101',
  },
  contacts: {
    /** kind lead, status new, with the open P2 lead referred by Ana. */
    marta: '00000000-0000-4000-8000-000000000201',
    /** kind client, active_client, linked to Ana's user. */
    ana: '00000000-0000-4000-8000-000000000202',
    /** kind agency, pending, due yesterday (C2 inbox). */
    agency: '00000000-0000-4000-8000-000000000203',
    recruiter: '00000000-0000-4000-8000-000000000204',
    /** kind client, invited as sin@test, no user. */
    invitedSin: '00000000-0000-4000-8000-000000000205',
    /** Carla's: a client, an open lead and an agency (owner carla). */
    carlaClient: '00000000-0000-4000-8000-000000000210',
    carlaLead: '00000000-0000-4000-8000-000000000211',
    carlaAgency: '00000000-0000-4000-8000-000000000212',
    /** Dani's only contact (owner dani, switched off). */
    dani: '00000000-0000-4000-8000-000000000220',
  },
  leads: {
    /** Marta: open, P2, web_proposal, affiliate ANA-TEST01. */
    marta: '00000000-0000-4000-8000-000000000301',
    /** Ana: won and paid, P2, affiliate BOB-TEST01. */
    ana: '00000000-0000-4000-8000-000000000302',
    invitedSin: '00000000-0000-4000-8000-000000000303',
    /** Carla's won lead of 1.000 EUR (commission pending at 10 %). */
    carlaWon: '00000000-0000-4000-8000-000000000310',
    /** Carla's open lead (P2). */
    carlaOpen: '00000000-0000-4000-8000-000000000311',
  },
  clients: {
    ana: '00000000-0000-4000-8000-000000000401',
    invitedSin: '00000000-0000-4000-8000-000000000402',
    /** Carla's client, portal invitation not claimed. */
    carla: '00000000-0000-4000-8000-000000000410',
  },
  tasks: {
    anaDone: '00000000-0000-4000-8000-000000000501',
    anaPending: '00000000-0000-4000-8000-000000000502',
  },
  taskComments: {
    internal: '00000000-0000-4000-8000-000000000601',
    visible: '00000000-0000-4000-8000-000000000602',
  },
  affiliates: {
    ana: '00000000-0000-4000-8000-000000000801',
    bob: '00000000-0000-4000-8000-000000000802',
  },
  rewards: {
    /** Bob's pending reward for Ana's lead. */
    bobForAna: '00000000-0000-4000-8000-000000000901',
  },
  blogComments: {
    approvedBob: '00000000-0000-4000-8000-000000000a01',
    pendingAna: '00000000-0000-4000-8000-000000000a02',
    pendingBob: '00000000-0000-4000-8000-000000000a03',
  },
  chatContexts: {
    /** client/es v1, published. */
    clientEs: '00000000-0000-4000-8000-000000000b01',
    /** curious/es v1, published. */
    curiousEs: '00000000-0000-4000-8000-000000000b02',
    /** partner/es v1, draft (nothing published for partner). */
    partnerEsDraft: '00000000-0000-4000-8000-000000000b03',
  },
  chatThreads: {
    /** case partner, no user, no contact, unread for the admin. */
    anonymous: '00000000-0000-4000-8000-000000000c01',
    /** case client, Ana's user and contact, read. */
    ana: '00000000-0000-4000-8000-000000000c02',
  },
  /** Task 1.8e. */
  stories: { ana: '00000000-0000-4000-8000-000000000e01' },
  commissions: { carla: '00000000-0000-4000-8000-000000000f01' },
  imports: { carla: '00000000-0000-4000-8000-000000001001' },
  /** Carla's row whose email is Marta's (Jose's contact), pending. */
  conflicts: { carlaMarta: '00000000-0000-4000-8000-000000001101' },
  quotes: { carla: '00000000-0000-4000-8000-000000001201' },
  content: {
    /** message_override home.hero.title (es): published «Titular publicado», draft «Borrador del titular». */
    heroTitle: '00000000-0000-4000-8000-000000001401',
    settings: '00000000-0000-4000-8000-000000001402',
  },
} as const;

export type TestUserName = 'jose' | 'ana' | 'bob' | 'sin' | 'carla' | 'dani';
export type TestClientName = TestUserName | 'anon';

export type TestClient = SupabaseClient & {
  userId: string | null;
  affiliateId: string | null;
  leadId: string | null;
  contactId: string | null;
  clientId: string | null;
};

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

/** Staff accounts: the database only honours them with an aal2 token (TOTP, DATOS §14.3 / Q24). */
const STAFF: readonly TestUserName[] = ['jose', 'carla', 'dani'];
const FACTOR_NAME = 'rls-tests';

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
    contactId: name === 'ana' ? SEED.contacts.ana : null,
    clientId: name === 'ana' ? SEED.clients.ana : null,
  });
}

/** Deletes the throwaway authenticator factors a previous (crashed) run may have left, then the ones of this run. */
async function dropTestFactors(userId: string): Promise<void> {
  const service = serviceClient();
  const { data } = await service.auth.admin.mfa.listFactors({ userId });
  for (const f of data?.factors ?? []) {
    if (f.friendly_name === FACTOR_NAME) await service.auth.admin.mfa.deleteFactor({ id: f.id, userId });
  }
}

const enrolled: string[] = [];

/** Removes the factors the tests enrolled. Call from afterAll; the issued tokens stay valid until they expire. */
export async function cleanupTestFactors(): Promise<void> {
  await Promise.all(enrolled.splice(0).map((id) => dropTestFactors(id)));
}

/** Enrols a TOTP factor, answers its challenge with the computed code and leaves the client with an aal2 session. */
async function elevateToAal2(client: SupabaseClient, userId: string): Promise<void> {
  await dropTestFactors(userId);
  const enroll = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName: FACTOR_NAME });
  if (enroll.error || !enroll.data) throw new Error(`mfa enroll failed: ${enroll.error?.message}`);
  enrolled.push(userId);
  const challenge = await client.auth.mfa.challenge({ factorId: enroll.data.id });
  if (challenge.error || !challenge.data) throw new Error(`mfa challenge failed: ${challenge.error?.message}`);
  const verify = await client.auth.mfa.verify({
    factorId: enroll.data.id,
    challengeId: challenge.data.id,
    code: totp(enroll.data.totp.secret),
  });
  if (verify.error) throw new Error(`mfa verify failed: ${verify.error.message}`);
}

/**
 * Logs in by password as one of the seeded accounts (`<name>@test`). `sin@test` is seeded unconfirmed and GoTrue
 * refuses the login of an unconfirmed email, so it is confirmed just for the login and unconfirmed again right
 * after: the access token stays valid while the database sees the email as unconfirmed, which is what the RPCs check.
 * Staff (jose, carla, dani) are elevated to aal2 with a throwaway TOTP factor, as the database requires; pass
 * `{ aal: 'aal1' }` to keep the password-only session (the token an attacker with a stolen cookie would have).
 */
export async function clientFor(name: TestClientName, opts: { aal?: 'aal1' | 'aal2' } = {}): Promise<TestClient> {
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
  if (STAFF.includes(name) && (opts.aal ?? 'aal2') === 'aal2') await elevateToAal2(client, SEED.users[name]);
  return withIds(client, name);
}
