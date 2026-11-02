// The notification rules as the matrix of D3 draws them (DATOS §14.6): one row per outbox event, one column per
// «recipient by channel». A rule is a cell; a cell is on when its rule exists and is enabled. The database keeps one
// row per rule (`notification_rules`); here a rule is the key `<event>|<column>`.

export const NOTIFICATIONS_PATH = '/admin/notificaciones';

export type RuleChannel = 'telegram' | 'email';

/** `admin`, `owner` and `client` are the fixed columns; `user:<uuid>:<channel>` is a named person (`staff_user`). */
export type RuleColumn =
  | { id: 'admin' | 'owner' | 'client'; kind: 'admin' | 'owner' | 'client'; channel: RuleChannel }
  | { id: string; kind: 'user'; channel: RuleChannel; userId: string; name: string };

export const BASE_COLUMNS: readonly RuleColumn[] = [
  { id: 'admin', kind: 'admin', channel: 'telegram' },
  { id: 'owner', kind: 'owner', channel: 'telegram' },
  { id: 'client', kind: 'client', channel: 'email' },
];

/** The events of the outbox, in the order of the screen, with who can be told about each (the screen draws «—» elsewhere). */
export const RULE_EVENTS = [
  { id: 'leadCreated', db: 'lead.created', to: ['admin', 'owner'] },
  { id: 'leadCloseRequested', db: 'lead.close_requested', to: ['admin'] },
  { id: 'importDone', db: 'crm.import_done', to: ['admin', 'owner'] },
  { id: 'importConflicts', db: 'crm.import_conflicts', to: ['admin'] },
  { id: 'importConflictResolved', db: 'crm.import_conflict_resolved', to: ['admin', 'owner'] },
  { id: 'quoteSent', db: 'quote.sent', to: ['admin'] },
  { id: 'storyProposed', db: 'story.proposed', to: ['admin', 'owner'] },
  { id: 'storyDecided', db: 'story.decided', to: ['admin', 'owner', 'client'] },
  { id: 'commissionCreated', db: 'commission.created', to: ['admin', 'owner'] },
  { id: 'commissionApproved', db: 'commission.approved', to: ['admin', 'owner'] },
  { id: 'commissionPaid', db: 'commission.paid', to: ['admin', 'owner'] },
  { id: 'commissionRejected', db: 'commission.rejected', to: ['admin', 'owner'] },
  { id: 'commentClient', db: 'comment.client', to: ['admin', 'owner'] },
  { id: 'commentPending', db: 'comment.pending', to: ['admin'] },
  { id: 'upgradeRequested', db: 'upgrade.requested', to: ['admin'] },
  { id: 'assetUploaded', db: 'asset.uploaded', to: ['admin'] },
  { id: 'contentDeployed', db: 'content.deployed', to: ['admin'] },
  { id: 'contentDeployFailed', db: 'content.deploy_failed', to: ['admin'] },
  { id: 'chatVisitorMessage', db: 'chat.visitor_message', to: ['admin'] },
  { id: 'staffInvited', db: 'staff.invited', to: ['client'] },
  { id: 'staffClaimed', db: 'staff.claimed', to: ['admin'] },
  { id: 'clientInvited', db: 'client.invited', to: ['client'] },
] as const satisfies readonly { id: string; db: string; to: readonly ('admin' | 'owner' | 'client')[] }[];

export type RuleEventId = (typeof RULE_EVENTS)[number]['id'];
export type RuleEvent = (typeof RULE_EVENTS)[number];

export type RuleCandidate = { id: string; name: string };

export type RulesState = {
  /** The persons with a rule of their own, after the three fixed columns. */
  people: readonly Extract<RuleColumn, { kind: 'user' }>[];
  /** The cells that are on, as `ruleKey(event, column)`. */
  on: readonly string[];
};

export function ruleKey(event: RuleEventId, columnId: string): string {
  return `${event}|${columnId}`;
}

export function personColumnId(userId: string, channel: RuleChannel): string {
  return `user:${userId}:${channel}`;
}

/** Does it make sense to tell this column about this event? A named person can be told about anything but the invitations. */
export function appliesTo(event: RuleEvent, column: RuleColumn): boolean {
  const to = event.to as readonly string[];
  if (column.kind === 'user') return !(to.length === 1 && to[0] === 'client');
  return to.includes(column.kind);
}

/** How many cells differ between two states of the same columns (a cell turned on and off again counts for nothing). */
export function countChanges(saved: readonly string[], now: readonly string[]): number {
  const before = new Set(saved);
  const after = new Set(now);
  let changes = 0;
  for (const key of after) if (!before.has(key)) changes += 1;
  for (const key of before) if (!after.has(key)) changes += 1;
  return changes;
}

type RuleRow = { event: string; recipient: 'admin' | 'owner' | 'staff_user' | 'client'; recipient_user_id: string | null; channel: RuleChannel; enabled: boolean };

/** `notification_rules` rows → the state of the matrix. Rules the screen cannot draw (an admin by email) are left out. */
export function rulesFromRows(rows: readonly RuleRow[], names: ReadonlyMap<string, string>): RulesState {
  const events = new Map<string, RuleEventId>(RULE_EVENTS.map((event) => [event.db, event.id]));
  const people = new Map<string, Extract<RuleColumn, { kind: 'user' }>>();
  const on: string[] = [];
  for (const row of rows) {
    const event = events.get(row.event);
    if (!event) continue;
    if (row.recipient === 'staff_user' && row.recipient_user_id) {
      const id = personColumnId(row.recipient_user_id, row.channel);
      if (!people.has(id)) {
        people.set(id, { id, kind: 'user', channel: row.channel, userId: row.recipient_user_id, name: names.get(row.recipient_user_id) ?? '—' });
      }
      if (row.enabled) on.push(ruleKey(event, id));
      continue;
    }
    const base = BASE_COLUMNS.find((column) => column.kind === row.recipient && column.channel === row.channel);
    if (base && row.enabled) on.push(ruleKey(event, base.id));
  }
  return { people: [...people.values()], on };
}
