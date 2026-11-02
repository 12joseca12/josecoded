import type { StaffRole } from '@/lib/auth/staff';

export const TEAM_PATH = '/admin/equipo';

/** What the admin may reassign from a closer's portfolio: everything, the open leads, or the agencies. */
export interface TeamPortfolio {
  all: number;
  openLeads: number;
  agencies: number;
}

/** One person of the team as D1 shows them (the admin reads everyone's rate, contacts and pending commissions). */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  disabled: boolean;
  /** Commission rate in percent; `null` for the admin, who earns none. */
  rate: number | null;
  telegram: boolean;
  /** Has set up the authenticator (TOTP); `false` until the first login. */
  totp: boolean;
  portfolio: TeamPortfolio;
  pendingCount: number;
  pendingAmount: number;
}

/** A staff invitation not yet claimed; it expires `expiresAt`. */
export interface TeamInvite {
  id: string;
  email: string;
  role: StaffRole;
  rate: number;
  note: string | null;
  expiresAt: string;
}

export const PERCENT_FORMAT = { style: 'percent', maximumFractionDigits: 2 } as const;

export function isExpired(invite: Pick<TeamInvite, 'expiresAt'>, now = Date.now()): boolean {
  return Date.parse(invite.expiresAt) <= now;
}
