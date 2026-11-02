import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  user: null as null | { id: string },
  staff: null as null | { role: string; disabled_at?: string | null },
  level: 'aal1' as string,
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
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.staff }) }) }) }),
  }),
}));

import { requireAdmin, requireUser } from './guards';

afterEach(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  state.user = null;
  state.staff = null;
  state.level = 'aal1';
});

it('redirects anonymous users to the localized login, remembering where they were going', async () => {
  await expect(requireUser({ locale: 'es', next: '/area-clientes/tareas' })).rejects.toThrow(
    'REDIRECT /auth/login?next=%2Farea-clientes%2Ftareas',
  );
  await expect(requireUser({ locale: 'en', next: '/en/client-area' })).rejects.toThrow(
    'REDIRECT /en/auth/login?next=%2Fen%2Fclient-area',
  );
});

it('never forwards an external next', async () => {
  await expect(requireUser({ locale: 'es', next: 'https://evil.com' })).rejects.toThrow(
    'REDIRECT /auth/login?next=%2F',
  );
});

it('passes a signed-in user', async () => {
  state.user = { id: 'u' };
  await expect(requireUser({ locale: 'es' })).resolves.toMatchObject({ user: { id: 'u' } });
});

it('404s users that are not staff', async () => {
  state.user = { id: 'u' };
  await expect(requireAdmin({ locale: 'es' })).rejects.toThrow('NOT_FOUND');
});

it('404s a deactivated admin, even at aal2 (disabled_at, as staff.ts)', async () => {
  state.user = { id: 'u' };
  state.staff = { role: 'admin', disabled_at: '2026-11-01T00:00:00Z' };
  state.level = 'aal2';
  await expect(requireAdmin({ locale: 'es' })).rejects.toThrow('NOT_FOUND');
});

it('sends an admin without a verified TOTP to the profile', async () => {
  state.user = { id: 'u' };
  state.staff = { role: 'admin' };
  await expect(requireAdmin({ locale: 'es' })).rejects.toThrow('REDIRECT /perfil?mfa=1');
  await expect(requireAdmin({ locale: 'en' })).rejects.toThrow('REDIRECT /en/profile?mfa=1');
});

it('passes an admin at aal2', async () => {
  state.user = { id: 'u' };
  state.staff = { role: 'admin' };
  state.level = 'aal2';
  await expect(requireAdmin({ locale: 'es' })).resolves.toMatchObject({ user: { id: 'u' } });
});

it('lifts the second factor only when ADMIN_REQUIRE_MFA is exactly "false" (same as requireStaff)', async () => {
  state.user = { id: 'u' };
  state.staff = { role: 'admin' };
  vi.stubEnv('ADMIN_REQUIRE_MFA', 'false');
  await expect(requireAdmin({ locale: 'es' })).resolves.toMatchObject({ user: { id: 'u' } });
  for (const value of ['no', 'False', 'true']) {
    vi.stubEnv('ADMIN_REQUIRE_MFA', value);
    await expect(requireAdmin({ locale: 'es' })).rejects.toThrow('REDIRECT /perfil?mfa=1');
  }
  // the exception never lifts the admin check
  vi.stubEnv('ADMIN_REQUIRE_MFA', 'false');
  state.staff = { role: 'closer' };
  await expect(requireAdmin({ locale: 'es' })).rejects.toThrow('NOT_FOUND');
});
