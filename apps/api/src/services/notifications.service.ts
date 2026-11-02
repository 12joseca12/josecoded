// Who is told about an outbox event, and how (task 3.8b, DATOS §14.4 and §14.6). The admin's rules (`notification_rules`) are
// resolved by `notification_recipients()` and cached five minutes per event and owner in the isolate; this file turns
// each recipient into a Telegram message (to the chat the person linked) or into one of the fixed emails.
// Idempotency: an event is acked only when every recipient got it. When a later recipient fails after an earlier one
// succeeded, the earlier ones are marked in the NoticeLedger, so the retry of the event does not send them again.
import { isEmailTemplateId } from '../templates';
import { sha256Hex } from '../utils/crypto';
import { logEvent } from '../utils/http-error';

import type { Deps } from '../deps';
import type { Recipient } from '../ports';
import type { EmailTemplateId, OutboxEvent } from '@josecoded/types';

export const RECIPIENTS_TTL_MS = 5 * 60_000;
export const RECIPIENTS_FALLBACK_TTL_MS = 30_000;
/** More than this many recipients for one event are dropped (a runaway rule must not eat the subrequest budget of a tick). */
export const MAX_RECIPIENTS = 4;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TELEGRAM_CHAT_ID = /^-?\d{1,20}$/;
const EMAIL = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,255}$/;

const ADMIN_CHAT: Recipient = { channel: 'telegram', address: null, adminChat: true };

/** The email each event may send, to the client of the event (the rest of the events never produce an email). */
export const EVENT_EMAIL_TEMPLATE: Readonly<Record<string, EmailTemplateId>> = {
  'staff.invited': 'staff-invited',
  'client.invited': 'client-invited',
  'story.decided': 'story-decided',
};

/** The person an event is «owned» by: `owner_id` of the contact, or `closer_id` of a commission. */
export function ownerOf(payload: Record<string, unknown>): string | null {
  for (const key of ['owner_id', 'closer_id']) {
    const value = payload[key];
    if (typeof value === 'string' && UUID.test(value)) return value;
  }
  return null;
}

type CacheEntry = { recipients: Recipient[]; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 200;

/** For tests: the cache lives as long as the isolate. */
export function resetRecipientsCache(): void {
  cache.clear();
}

function clean(recipients: Recipient[]): Recipient[] {
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const r of recipients) {
    if (r.channel === 'telegram' && r.address !== null && !TELEGRAM_CHAT_ID.test(r.address)) continue;
    if (r.channel === 'email' && r.address !== null && !EMAIL.test(r.address)) continue;
    const key = `${r.channel}:${r.address ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ channel: r.channel, address: r.address });
  }
  if (out.length > MAX_RECIPIENTS) logEvent('notifications', 'recipients_truncated', { count: out.length });
  return out.slice(0, MAX_RECIPIENTS);
}

/**
 * The recipients of `event`. `system.*` always tells Jose, outside the rules table. Without rules for an event the answer is
 * `[]`: nobody is told. When the rules cannot be read (migration not applied yet, Supabase down) Jose's own chat is the net, for
 * thirty seconds, so an outage never silences the alerts. `beforeFetch` lets the caller count the subrequest.
 */
export async function resolveRecipients(
  deps: Pick<Deps, 'recipients' | 'clock'>,
  event: string,
  payload: Record<string, unknown>,
  options: { beforeFetch?: () => void } = {},
): Promise<Recipient[]> {
  if (event.startsWith('system.') || !deps.recipients) return [ADMIN_CHAT];
  const ownerId = ownerOf(payload);
  const key = `${event}|${ownerId ?? ''}`;
  const now = deps.clock.now().getTime();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.recipients;

  let recipients: Recipient[];
  let ttl = RECIPIENTS_TTL_MS;
  options.beforeFetch?.();
  try {
    recipients = clean(await deps.recipients.forEvent(event, ownerId));
  } catch (error) {
    logEvent('notifications', 'recipients_unavailable', { event: event.slice(0, 60), reason: error instanceof Error ? error.name : 'error' });
    recipients = [ADMIN_CHAT];
    ttl = RECIPIENTS_FALLBACK_TTL_MS;
  }
  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  cache.set(key, { recipients, expiresAt: now + ttl });
  return recipients;
}

const asLocale = (value: unknown): 'es' | 'en' | undefined => (value === 'es' || value === 'en' ? value : undefined);

/** Variables of a template taken from the event's payload (enums only; anything else is dropped). */
function emailVars(templateId: EmailTemplateId, payload: Record<string, unknown>): Record<string, string> {
  if (templateId === 'staff-invited') return { role: payload.role === 'admin' ? 'admin' : 'closer' };
  if (templateId === 'story-decided') {
    const status = payload.status;
    return { status: status === 'rejected' || status === 'converted' ? status : 'accepted' };
  }
  return {};
}

type Spend = () => void;

/**
 * Sends `text` (Telegram) or the event's fixed email to one recipient. `spend` counts each outbound call against the tick's
 * subrequest budget. Throws on failure; returns without doing anything when the recipient cannot be reached by design
 * (a rule that asks for an email with no template, or a client Telegram: clients have no chat id).
 */
export async function deliver(deps: Deps, event: OutboxEvent, recipient: Recipient, text: string, spend: Spend): Promise<void> {
  if (recipient.channel === 'telegram') {
    if (recipient.address === null && !recipient.adminChat) {
      logEvent('notifications', 'telegram_without_chat', { event: event.event.slice(0, 60) });
      return;
    }
    if (!deps.telegram) throw new Error('telegram_not_configured');
    spend();
    await deps.telegram.sendMessage(text, recipient.address ?? undefined);
    return;
  }

  const templateId = EVENT_EMAIL_TEMPLATE[event.event];
  if (!templateId || !isEmailTemplateId(templateId)) {
    logEvent('notifications', 'no_email_template', { event: event.event.slice(0, 60) });
    return;
  }
  if (!deps.email) throw new Error('email_not_configured');
  let to = recipient.address;
  let locale = asLocale(event.payload.locale);
  if (to === null) {
    const email = event.payload.email;
    if (typeof email === 'string' && EMAIL.test(email)) {
      to = email;
    } else if (typeof event.payload.client_id === 'string' && UUID.test(event.payload.client_id) && deps.clientContacts) {
      spend();
      const contact = await deps.clientContacts.contactOf(event.payload.client_id);
      to = contact?.email ?? null;
      locale ??= contact?.locale;
    }
  }
  if (to === null) {
    logEvent('notifications', 'email_without_address', { event: event.event.slice(0, 60) });
    return;
  }
  spend();
  await deps.email.sendEmail({
    templateId,
    to,
    locale: locale ?? 'es',
    vars: emailVars(templateId, event.payload),
    idempotencyKey: `outbox-${event.id}`,
  });
}

async function recipientKey(eventId: number, recipient: Recipient): Promise<string> {
  const who = await sha256Hex(`${recipient.channel}:${recipient.address ?? ''}`);
  return `outbox:${eventId}:${who.slice(0, 16)}`;
}

/**
 * Delivers one event to all its recipients. With more than one, the NoticeLedger remembers who already got it: on a retry
 * (`attempts > 1`) those are skipped, and when this attempt fails midway the ones it did reach are marked before throwing.
 * With one recipient nothing is remembered: acking or failing the event is already exact.
 */
export async function deliverAll(deps: Deps, event: OutboxEvent, recipients: Recipient[], text: string, spend: Spend): Promise<void> {
  const several = recipients.length > 1 && deps.notices !== undefined;
  const reached: string[] = [];
  let failure: unknown;
  for (const recipient of recipients) {
    const key = several ? await recipientKey(event.id, recipient) : undefined;
    try {
      if (key && event.attempts > 1) {
        spend();
        if (await deps.notices!.wasSent(key)) continue;
      }
      await deliver(deps, event, recipient, text, spend);
      if (key) reached.push(key);
    } catch (error) {
      failure = error;
      break;
    }
  }
  if (failure !== undefined) {
    for (const key of reached) {
      try {
        spend();
        await deps.notices!.markSent(key);
      } catch {
        break; // out of budget or the ledger is down: the retry may repeat a message, never lose one
      }
    }
    throw failure;
  }
}
