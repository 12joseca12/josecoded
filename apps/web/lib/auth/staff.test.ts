import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  user: null as null | { id: string },
  staff: null as null | { role: string; disabled_at: string | null },
  level: 'aal1' as string,
  queries: 0,
}));

vi.mock('next/navigation', async (importActual) => ({
  ...(await importActual<typeof import('next/navigation')>()),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
      mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: state.level } }) },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            state.queries += 1;
            return { data: state.staff };
          },
        }),
      }),
    }),
  }),
}));

import { requireStaff } from './staff';

beforeEach(() => {
  state.user = { id: 'u' };
  state.staff = null;
  state.level = 'aal1';
  state.queries = 0;
});
afterEach(() => {
  vi.unstubAllEnvs();
});

it('sends an anonymous visitor to the login', async () => {
  state.user = null;
  await expect(requireStaff({ locale: 'es', next: '/crm' })).rejects.toThrow('REDIRECT /auth/login?next=%2Fcrm');
});

it('404s a user that is not staff', async () => {
  await expect(requireStaff({ locale: 'es' })).rejects.toThrow('NOT_FOUND');
});

it('404s a deactivated closer even with aal2', async () => {
  state.staff = { role: 'closer', disabled_at: '2026-11-01T00:00:00Z' };
  state.level = 'aal2';
  await expect(requireStaff({ locale: 'es' })).rejects.toThrow('NOT_FOUND');
});

it('404s a role that is neither admin nor closer', async () => {
  state.staff = { role: 'viewer', disabled_at: null };
  state.level = 'aal2';
  await expect(requireStaff({ locale: 'es' })).rejects.toThrow('NOT_FOUND');
});

it('sends an active closer without aal2 to the profile, in the right language', async () => {
  state.staff = { role: 'closer', disabled_at: null };
  await expect(requireStaff({ locale: 'es' })).rejects.toThrow('REDIRECT /perfil?mfa=1');
  await expect(requireStaff({ locale: 'en' })).rejects.toThrow('REDIRECT /en/profile?mfa=1');
});

it('requires aal2 of an admin too', async () => {
  state.staff = { role: 'admin', disabled_at: null };
  await expect(requireStaff({ locale: 'es' })).rejects.toThrow('REDIRECT /perfil?mfa=1');
});

it('passes an active closer and an admin at aal2, with their role', async () => {
  state.level = 'aal2';
  state.staff = { role: 'closer', disabled_at: null };
  await expect(requireStaff({ locale: 'es' })).resolves.toMatchObject({ role: 'closer', user: { id: 'u' } });
  state.staff = { role: 'admin', disabled_at: null };
  await expect(requireStaff({ locale: 'es' })).resolves.toMatchObject({ role: 'admin' });
});

it('lifts the second factor only when ADMIN_REQUIRE_MFA is exactly "false"', async () => {
  state.staff = { role: 'closer', disabled_at: null };
  vi.stubEnv('ADMIN_REQUIRE_MFA', 'false');
  await expect(requireStaff({ locale: 'es' })).resolves.toMatchObject({ role: 'closer' });
  vi.stubEnv('ADMIN_REQUIRE_MFA', 'no');
  await expect(requireStaff({ locale: 'es' })).rejects.toThrow('REDIRECT /perfil?mfa=1');
  // the exception never lifts the staff check
  vi.stubEnv('ADMIN_REQUIRE_MFA', 'false');
  state.staff = null;
  await expect(requireStaff({ locale: 'es' })).rejects.toThrow('NOT_FOUND');
});
