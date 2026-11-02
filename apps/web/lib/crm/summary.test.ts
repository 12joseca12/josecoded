import { describe, expect, it } from 'vitest';

import { k1Figures } from './summary';

import type { CrmSummary } from './queries';

const base: CrmSummary = {
  role: 'closer',
  my: {
    contacts_due: 3,
    leads_open: 5,
    stories_proposed: 1,
    commissions_pending: 1,
    commissions_approved_amount: 90,
    conflicts_pending: 1,
    imports_last: null,
  },
  team: { team_contacts: 128, team_leads_won_month: 2, team_leads_open: 16 },
  admin: null,
};

describe('k1Figures', () => {
  it('shows a closer her own numbers', () => {
    expect(k1Figures(base)).toMatchObject({
      contactsDue: 3,
      leadsOpen: 5,
      storiesProposed: 1,
      commissionsPending: 1,
      commissionsApprovedAmount: 90,
      conflictsPending: 1,
      unassignedDue: 0,
      scope: 'mine',
    });
  });

  it('shows the admin the whole CRM, not just the contacts without an owner', () => {
    const admin = { contacts_due: 4, leads_open: 16, stories_proposed: 3, commissions_pending: 2 } as CrmSummary['admin'];
    expect(k1Figures({ ...base, role: 'admin', admin })).toMatchObject({
      contactsDue: 4,
      leadsOpen: 16,
      storiesProposed: 3,
      commissionsPending: 2,
      // what only the portfolio knows stays his own
      commissionsApprovedAmount: 90,
      conflictsPending: 1,
      // his own portfolio is the contacts without an owner: those are the overdue ones nobody has
      unassignedDue: 3,
      scope: 'all',
    });
  });

  it('carries the team numbers as they come', () => {
    expect(k1Figures(base).team).toEqual(base.team);
  });
});
