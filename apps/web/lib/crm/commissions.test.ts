import { describe, expect, it } from 'vitest';

import {
  canTransition,
  closersOf,
  commissionTone,
  commissionsHref,
  filterCommissions,
  parseCommissionQuery,
  rateDiffers,
  totalsByStatus,
  type CommissionRecord,
} from './commissions';

const CARLA = '00000000-0000-4000-8000-0000000000a5';
const IVAN = '00000000-0000-4000-8000-0000000000a7';

function row(partial: Partial<CommissionRecord>): CommissionRecord {
  return {
    id: 'c1',
    closerId: CARLA,
    closerName: 'Carla Méndez',
    closerDisabled: false,
    closerRate: 10,
    contactName: 'Marina Soler',
    organization: null,
    packCode: 'P2',
    packOption: null,
    closedAt: '2026-10-31T10:00:00.000Z',
    baseAmount: 1400,
    percent: 10,
    amount: 140,
    status: 'pending',
    approvedAt: null,
    paidAt: null,
    paidNote: null,
    rejectedReason: null,
    ...partial,
  };
}

describe('canTransition', () => {
  it('pending goes to approved or rejected, never straight to paid', () => {
    expect(canTransition('pending', 'approved')).toBe(true);
    expect(canTransition('pending', 'rejected')).toBe(true);
    expect(canTransition('pending', 'paid')).toBe(false);
  });

  it('approved only goes to paid', () => {
    expect(canTransition('approved', 'paid')).toBe(true);
    expect(canTransition('approved', 'rejected')).toBe(false);
    expect(canTransition('approved', 'approved')).toBe(false);
    expect(canTransition('approved', 'pending')).toBe(false);
  });

  it('paid and rejected are final', () => {
    for (const to of ['pending', 'approved', 'paid', 'rejected'] as const) {
      expect(canTransition('rejected', to)).toBe(false);
      expect(canTransition('paid', to)).toBe(false);
    }
  });
});

describe('totalsByStatus', () => {
  it('has the four statuses even when there are no rows', () => {
    expect(totalsByStatus([])).toEqual({
      pending: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 },
    });
  });

  it('sums per status with two decimals, without float drift', () => {
    const totals = totalsByStatus([
      row({ id: 'a', amount: 0.1 }),
      row({ id: 'b', amount: 0.2 }),
      row({ id: 'c', amount: 108.35, status: 'approved' }),
      row({ id: 'd', amount: 300, status: 'paid' }),
      row({ id: 'e', amount: 112, status: 'paid' }),
      row({ id: 'f', amount: 90, status: 'rejected' }),
    ]);
    expect(totals.pending).toEqual({ count: 2, amount: 0.3 });
    expect(totals.approved).toEqual({ count: 1, amount: 108.35 });
    expect(totals.paid).toEqual({ count: 2, amount: 412 });
    expect(totals.rejected).toEqual({ count: 1, amount: 90 });
  });
});

describe('commissionTone', () => {
  it('pending waits for the admin, paid is done, rejected is over', () => {
    expect(commissionTone('pending')).toBe('attention');
    expect(commissionTone('approved')).toBe('active');
    expect(commissionTone('paid')).toBe('live');
    expect(commissionTone('rejected')).toBe('muted');
  });
});

describe('rateDiffers', () => {
  it('flags a frozen percent that is not the current rate of the closer', () => {
    expect(rateDiffers(row({ percent: 8, closerRate: 10 }))).toBe(true);
    expect(rateDiffers(row({ percent: 10, closerRate: 10 }))).toBe(false);
    expect(rateDiffers(row({ percent: 10, closerRate: 10.004 }))).toBe(false);
  });
});

describe('parseCommissionQuery', () => {
  it('keeps a known status and a uuid closer, drops the rest', () => {
    expect(parseCommissionQuery({ status: 'paid', closer: CARLA })).toEqual({ status: 'paid', closer: CARLA });
    expect(parseCommissionQuery({ status: 'weird', closer: 'x' })).toEqual({ status: null, closer: null });
    expect(parseCommissionQuery({ status: ['approved', 'paid'] })).toEqual({ status: 'approved', closer: null });
    expect(parseCommissionQuery({})).toEqual({ status: null, closer: null });
  });
});

describe('commissionsHref', () => {
  it('builds the URL from the query with the patch on top', () => {
    expect(commissionsHref({ status: null, closer: null })).toBe('/crm/comisiones');
    expect(commissionsHref({ status: 'paid', closer: null })).toBe('/crm/comisiones?status=paid');
    expect(commissionsHref({ status: 'paid', closer: CARLA }, { status: null })).toBe(`/crm/comisiones?closer=${CARLA}`);
    expect(commissionsHref({ status: null, closer: null }, { closer: IVAN })).toBe(`/crm/comisiones?closer=${IVAN}`);
  });
});

describe('filterCommissions and closersOf', () => {
  const rows = [
    row({ id: 'a', status: 'pending' }),
    row({ id: 'b', status: 'paid', closerId: IVAN, closerName: 'Iván Robles', closerDisabled: true }),
    row({ id: 'c', status: 'paid' }),
  ];

  it('filters by closer and by status', () => {
    expect(filterCommissions(rows, { status: null, closer: null }).map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(filterCommissions(rows, { status: 'paid', closer: null }).map((r) => r.id)).toEqual(['b', 'c']);
    expect(filterCommissions(rows, { status: 'paid', closer: CARLA }).map((r) => r.id)).toEqual(['c']);
  });

  it('lists each closer once, in order of name, with the switched-off flag', () => {
    expect(closersOf(rows)).toEqual([
      { id: CARLA, name: 'Carla Méndez', disabled: false },
      { id: IVAN, name: 'Iván Robles', disabled: true },
    ]);
  });
});
