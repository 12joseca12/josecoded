import { COMMISSION_STATUSES } from '@josecoded/types';

import type { CommissionStatus, StatusBadgeTone } from '@josecoded/types';

// Commissions of the closers (K5). The database is the authority (`admin_commission_*` accept only the transitions
// of `canTransition`); this mirrors it so the screen offers only what will be accepted, and holds the view-model
// and the arithmetic of the totals. Amounts are euros with cents as the database stores them (`numeric(10, 2)`).

/** Path of the screen (Spanish only: /crm has no English slug). */
export const COMMISSIONS_PATH = '/crm/comisiones';

/** One commission with who, what and which pack, as `staff_commissions()` returns it. */
export interface CommissionRecord {
  id: string;
  closerId: string;
  closerName: string;
  /** A closer that was switched off is still owed what he closed. */
  closerDisabled: boolean;
  /** The rate today, only to explain a frozen `percent` that differs. */
  closerRate: number;
  contactName: string;
  organization: string | null;
  packCode: string | null;
  packOption: string | null;
  /** The day the operation was closed (paid by the client). */
  closedAt: string;
  /** What the client paid. */
  baseAmount: number;
  /** The rate of the closer when the row was created; never recalculated (Q21). */
  percent: number;
  amount: number;
  status: CommissionStatus;
  approvedAt: string | null;
  paidAt: string | null;
  paidNote: string | null;
  rejectedReason: string | null;
}

/** The order of the totals and of the filter: what waits for a decision first. */
export const STATUS_ORDER: readonly CommissionStatus[] = COMMISSION_STATUSES;

const NEXT: Record<CommissionStatus, readonly CommissionStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['paid'],
  paid: [],
  rejected: [],
};

/** `pending → approved | rejected`, `approved → paid`; `paid` and `rejected` are final. */
export function canTransition(from: CommissionStatus, to: CommissionStatus): boolean {
  return NEXT[from].includes(to);
}

/** Tone of the badge of a status (the badge always carries the text too). */
export function commissionTone(status: CommissionStatus): StatusBadgeTone {
  switch (status) {
    case 'pending':
      return 'attention';
    case 'approved':
      return 'active';
    case 'paid':
      return 'live';
    case 'rejected':
      return 'muted';
  }
}

export interface StatusTotal {
  count: number;
  amount: number;
}

/** Count and amount per status, every status present. Summed in cents: 0.1 + 0.2 is 0.3 here. */
export function totalsByStatus(rows: readonly Pick<CommissionRecord, 'status' | 'amount'>[]): Record<CommissionStatus, StatusTotal> {
  const cents: Record<CommissionStatus, StatusTotal> = {
    pending: { count: 0, amount: 0 },
    approved: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
    rejected: { count: 0, amount: 0 },
  };
  for (const row of rows) {
    cents[row.status].count += 1;
    cents[row.status].amount += Math.round(row.amount * 100);
  }
  for (const status of STATUS_ORDER) cents[status].amount /= 100;
  return cents;
}

/** The frozen percent is not the closer's rate today: the row says so (Q21). */
export function rateDiffers(row: Pick<CommissionRecord, 'percent' | 'closerRate'>): boolean {
  return Math.abs(row.percent - row.closerRate) >= 0.005;
}

export interface CommissionQuery {
  status: CommissionStatus | null;
  /** Admin only: a closer's id. */
  closer: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `?status` and `?closer` of the URL: whatever is not a known value is dropped. */
export function parseCommissionQuery(raw: Record<string, string | string[] | undefined>): CommissionQuery {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const status = first(raw.status);
  const closer = first(raw.closer);
  return {
    status: (COMMISSION_STATUSES as readonly string[]).includes(status ?? '') ? (status as CommissionStatus) : null,
    closer: closer && UUID.test(closer) ? closer : null,
  };
}

/** The URL of the screen for a query with `patch` applied on top (`null` removes a filter). */
export function commissionsHref(query: CommissionQuery, patch: Partial<CommissionQuery> = {}): string {
  const next = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.status) params.set('status', next.status);
  if (next.closer) params.set('closer', next.closer);
  const search = params.toString();
  return search ? `${COMMISSIONS_PATH}?${search}` : COMMISSIONS_PATH;
}

/** The rows of a closer (or all) and, if asked, one status. The totals use the closer's rows with every status. */
export function filterCommissions(rows: readonly CommissionRecord[], query: CommissionQuery): CommissionRecord[] {
  return rows.filter(
    (row) => (!query.closer || row.closerId === query.closer) && (!query.status || row.status === query.status),
  );
}

export interface CommissionCloser {
  id: string;
  name: string;
  disabled: boolean;
}

/** The closers that have a commission, once each and in order of name: the options of the admin's filter. */
export function closersOf(rows: readonly CommissionRecord[]): CommissionCloser[] {
  const byId = new Map<string, CommissionCloser>();
  for (const row of rows) {
    if (!byId.has(row.closerId)) byId.set(row.closerId, { id: row.closerId, name: row.closerName, disabled: row.closerDisabled });
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** `Intl` options of every amount of the screen: euros with cents, and the thousands separator also on 1.400,00 € (es-ES leaves it out of four digits by default). */
export const MONEY_FORMAT = { style: 'currency', currency: 'EUR', useGrouping: 'always' } as const;
