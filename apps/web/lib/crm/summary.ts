import type { CrmSummary } from './queries';
import type { CloserCounters, TeamCounters } from '@josecoded/types';

export interface K1Figures {
  /** `mine`: the closer's portfolio. `all`: the admin reads the whole CRM (README §4 H: C1 folds into K1). */
  scope: 'mine' | 'all';
  contactsDue: number;
  leadsOpen: number;
  storiesProposed: number;
  commissionsPending: number;
  commissionsApprovedAmount: number;
  conflictsPending: number;
  importsLast: CloserCounters['imports_last'];
  team: TeamCounters;
}

/**
 * What the cards of K1 show. `crm_my_counters()` gives the admin only the contacts without owner, so for him the
 * counts of the portfolio come from `admin_counters()` (the whole CRM); the rest is the same for both roles.
 */
export function k1Figures({ role, my, team, admin }: CrmSummary): K1Figures {
  const all = role === 'admin' && admin !== null;
  return {
    scope: all ? 'all' : 'mine',
    contactsDue: all ? admin.contacts_due : my.contacts_due,
    leadsOpen: all ? admin.leads_open : my.leads_open,
    storiesProposed: all ? admin.stories_proposed : my.stories_proposed,
    commissionsPending: all ? admin.commissions_pending : my.commissions_pending,
    commissionsApprovedAmount: my.commissions_approved_amount,
    conflictsPending: my.conflicts_pending,
    importsLast: my.imports_last,
    team,
  };
}
