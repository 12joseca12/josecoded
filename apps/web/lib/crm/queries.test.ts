import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  rpc: vi.fn(),
  staffRow: { display_name: 'Carla Méndez', commission_rate: 10 } as { display_name: string | null; commission_rate: number } | null,
}));

// React's `cache` only dedupes inside a server render: here it is a memo by arguments, which is what the
// render gives (one call per key per request)
vi.mock('react', async (importActual) => ({
  ...(await importActual<typeof import('react')>()),
  cache: <A extends unknown[], R>(fn: (...args: A) => R) => {
    const memo = new Map<string, R>();
    return (...args: A) => {
      const key = JSON.stringify(args);
      if (!memo.has(key)) memo.set(key, fn(...args));
      return memo.get(key) as R;
    };
  },
}));
vi.mock('@/lib/auth/guards', () => ({
  getOptionalSession: async () => ({
    user: { id: 'u1' },
    supabase: {
      rpc: state.rpc,
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.staffRow }) }) }) }),
    },
  }),
}));

vi.mock('@/lib/admin/gateway', () => ({ adminFetch: vi.fn() }));

// fresh modules per test: the memo of `cache` lives as long as the module, like a request does
const load = async () => ({
  ...(await import('./queries')),
  ...(await import('@/lib/admin/queries')),
});

const MY = { contacts_due: 3, leads_open: 5 };
const TEAM = { team_contacts: 128, team_leads_won_month: 0, team_leads_open: 16 };
const ADMIN = { contacts_due: 4, leads_open: 16 };

beforeEach(() => {
  vi.resetModules();
  state.staffRow = { display_name: 'Carla Méndez', commission_rate: 10 };
  state.rpc.mockReset();
  state.rpc.mockImplementation(async (name: string) => ({
    data: { crm_my_counters: MY, crm_team_counters: TEAM, admin_counters: ADMIN }[name] ?? null,
    error: null,
  }));
});

describe('getCrmSummary', () => {
  it('asks a closer for her counters and the team ones, once each, and never for the admin ones', async () => {
    const { getCrmSummary } = await load();
    const summary = await getCrmSummary('closer');
    expect(summary).toEqual({ role: 'closer', my: MY, team: TEAM, admin: null });
    expect(state.rpc.mock.calls.map(([name]) => name).sort()).toEqual(['crm_my_counters', 'crm_team_counters']);
  });

  it('asks the admin for the three sets, in one round', async () => {
    const { getCrmSummary } = await load();
    const summary = await getCrmSummary('admin');
    expect(summary.admin).toEqual(ADMIN);
    expect(state.rpc.mock.calls.map(([name]) => name).sort()).toEqual(['admin_counters', 'crm_my_counters', 'crm_team_counters']);
  });

  it('shares the calls between the layout and the page of the same render', async () => {
    const { getCrmSummary } = await load();
    await Promise.all([getCrmSummary('closer'), getCrmSummary('closer')]);
    await getCrmSummary('closer');
    expect(state.rpc).toHaveBeenCalledTimes(2);
  });

  it('shares the admin counters with the summary of /admin', async () => {
    const { getCrmSummary, getAdminCounters } = await load();
    await getCrmSummary('admin');
    await getAdminCounters();
    expect(state.rpc.mock.calls.filter(([name]) => name === 'admin_counters')).toHaveLength(1);
  });

  it('fails loudly when a counter cannot be read, instead of showing zeros', async () => {
    state.rpc.mockImplementation(async () => ({ data: null, error: { message: 'boom' } }));
    const { getCrmSummary } = await load();
    await expect(getCrmSummary('closer')).rejects.toThrow('boom');
  });
});

describe('getStaffIdentity', () => {
  it('reads the own row once', async () => {
    const { getStaffIdentity } = await load();
    await expect(getStaffIdentity()).resolves.toEqual({ name: 'Carla Méndez', rate: 10 });
  });

  it('has no name when the row has none', async () => {
    state.staffRow = { display_name: null, commission_rate: 0 };
    const { getStaffIdentity } = await load();
    await expect(getStaffIdentity()).resolves.toEqual({ name: null, rate: 0 });
  });
});
