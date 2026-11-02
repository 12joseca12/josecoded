import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guards', () => ({ getOptionalSession: async () => null }));

import { storyClientName, sumCommissions } from './summary-extras';

describe('sumCommissions', () => {
  it('counts and adds each status apart, ignoring the rest', () => {
    const rows = [
      { status: 'pending', amount: 140 },
      { status: 'pending', amount: '108.5' },
      { status: 'approved', amount: 90 },
      { status: 'paid', amount: 500 },
    ];
    expect(sumCommissions(rows)).toEqual({
      pending: { count: 2, amount: 248.5 },
      approved: { count: 1, amount: 90 },
    });
  });

  it('is zero without rows', () => {
    expect(sumCommissions([])).toEqual({
      pending: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
    });
  });
});

describe('storyClientName', () => {
  it('names the client by its company, else by the person', () => {
    expect(
      storyClientName({
        display_name: 'Ana Ruiz',
        crm_organizations: { name: 'Panadería La Espiga' },
      }),
    ).toBe('Panadería La Espiga');
    expect(storyClientName({ display_name: 'Ana Ruiz', crm_organizations: null })).toBe('Ana Ruiz');
    expect(storyClientName(null)).toBeNull();
  });
});
