import { CONTACT_STATUSES, TERMINAL_CONTACT_STATUSES } from '@josecoded/types';

import type { StaffRole } from '@/lib/auth/staff';
import type { ContactKind } from '@josecoded/types';

// The status machine of a contact as the interface shows it. The database is the authority
// (`private.contact_status_ok`, `contact_status_terminal`, `closer_status_allowed`); this mirrors it so the sheet
// offers only what will be accepted.

/** Every status any kind can have: the keys of `crmContacts.status` in the messages. */
export type StatusKey = (typeof CONTACT_STATUSES)[ContactKind][number];

/** Statuses only «Cerrar cobrado» sets: a closer never picks them (`private.closer_status_allowed`). */
const ADMIN_ONLY_STATUSES: readonly string[] = ['won', 'active_client'];

/**
 * The statuses a person may choose for a kind, in the order of the sheet. Without a role, every status of the kind;
 * a closer never gets `won` nor `active_client` (the admin sets them with «Cerrar cobrado»).
 */
export function statusesFor(kind: ContactKind, role?: StaffRole): readonly string[] {
  const all: readonly string[] = CONTACT_STATUSES[kind];
  return role === 'closer' ? all.filter((status) => !ADMIN_ONLY_STATUSES.includes(status)) : all;
}

/** Statuses that end the follow-up: changing to one needs no next action. */
export function isTerminal(status: string): boolean {
  return (TERMINAL_CONTACT_STATUSES as readonly string[]).includes(status);
}

export function requiresNextAction(_kind: ContactKind, status: string): boolean {
  return !isTerminal(status);
}

/** A contact only moves to a status of its own kind, and a closer not to those of «Cerrar cobrado». */
export function canTransition(kind: ContactKind, _from: string, to: string, role?: StaffRole): boolean {
  return statusesFor(kind, role).includes(to);
}

/** Tone of the badge of a status (never the only signal: the badge always carries the text). */
export function statusTone(status: string): 'neutral' | 'active' | 'live' | 'attention' | 'muted' {
  switch (status) {
    case 'active_client':
    case 'won':
    case 'collaborating':
    case 'offer':
      return 'live';
    case 'contacted':
    case 'proposal_sent':
    case 'invited':
    case 'inmail_sent':
    case 'meeting':
    case 'in_process':
    case 'interview':
    case 'active':
      return 'active';
    case 'replied':
      return 'attention';
    case 'lost':
    case 'closed':
    case 'discarded':
    case 'rejected':
      return 'muted';
    default:
      return 'neutral';
  }
}
