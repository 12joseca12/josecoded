// Job `outbox.drain` (`* * * * *`: every tick of the `*/5` Cron Trigger; DATOS §4.7, §8.4, §14.6, Q2). Claims the live
// events of `private.outbox`, tells whoever the admin's rules name (Telegram per staff member, fixed-template emails;
// services/notifications.service.ts) and acks the delivered ones; a failed delivery is recorded with `outbox_fail`
// and retried on a later tick. After the 10th attempt the SQL dead-letters the event and enqueues `system.outbox_dead`,
// which this same job delivers (to Jose, outside the rules) on the next tick.
import { deliverAll, resolveRecipients } from '../services/notifications.service';

import type { JobHandler } from './job';
import type { OutboxEvent } from '@josecoded/types';

export const OUTBOX_DRAIN = 'outbox.drain';

/** Events per tick. Telegram allows about one message per second to one chat; the rest waits five minutes. */
export const MAX_BATCH = 20;
/**
 * Budget per event when claiming: the Telegram call and `outbox_fail`, plus one for the recipients lookup (cached
 * after the first event of its kind) or a second recipient. An event with more recipients or an email to a client
 * costs more; the loop below checks the budget before it starts one, and stops when it would not fit.
 */
const SUBREQUESTS_PER_EVENT = 3;

/**
 * How many events to claim with `remaining` subrequests left: the claim and the ack, then the worst case of each
 * event, so everything claimed is settled in this tick (an event claimed and left would wait 10 minutes and lose
 * an attempt). With the default budget of a tick (40, minus listDue and markRan) that is 12.
 */
export function batchLimit(remaining: number): number {
  return Math.max(0, Math.min(MAX_BATCH, Math.floor((remaining - 2) / SUBREQUESTS_PER_EVENT)));
}

function text(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '?';
}

/** Visitor-controlled text is cut to this many characters before it reaches Jose's Telegram. */
const MAX_FIELD = 60;

/** A visitor-controlled field: single line, at most MAX_FIELD characters, quoted so it reads as data. */
function quoted(payload: Record<string, unknown>, key: string): string {
  const raw = text(payload, key).replace(/\s+/g, ' ').trim();
  const cut = raw.length > MAX_FIELD ? `${raw.slice(0, MAX_FIELD - 1)}…` : raw;
  return `«${cut}»`;
}

/**
 * Events that may already have been notified by the request that created them (`POST /leads`, the chat): their
 * once-only key is `<event>:<payload.id>` (NoticeLedger). `undefined` for the rest.
 */
export function noticeKey(event: OutboxEvent): string | undefined {
  if (event.event !== 'lead.created' && !event.event.startsWith('chat.')) return undefined;
  const id = event.payload.id;
  return typeof id === 'string' || typeof id === 'number' ? `${event.event}:${id}` : undefined;
}

/** One Telegram notice per thread in this many seconds (task 4.4: «uno por hilo cada 10 min»). */
export const CHAT_NOTICE_WINDOW_SECONDS = 600;

/** The thread of a visitor chat message, whose notices are grouped; `undefined` for every other event. */
export function groupingThread(event: OutboxEvent): string | undefined {
  const id = event.payload.thread_id;
  return event.event === 'chat.visitor_message' && typeof id === 'string' && id ? id : undefined;
}

const COMMISSION_STATE = {
  'commission.created': 'creada',
  'commission.approved': 'aprobada',
  'commission.paid': 'pagada',
  'commission.rejected': 'rechazada',
} as const;

function shortSha(value: unknown): string {
  return typeof value === 'string' && /^[0-9a-f]{7,40}$/i.test(value) ? value.slice(0, 7) : '?';
}

/** Plain-text Telegram message. Payloads carry ids and short fields only, never message content. */
export function formatOutboxEvent({ event, payload }: OutboxEvent): string {
  const p = (key: string) => text(payload, key);
  switch (event) {
    case 'lead.created': {
      const pack = typeof payload.pack_code === 'string' ? ` · ${payload.pack_code}` : '';
      // the owner of the contact (a closer) is told too (rules); his id is in the notice
      const owner = typeof payload.owner_id === 'string' ? ` · propietario ${payload.owner_id}` : '';
      return `Nuevo lead (${p('source')}${pack}).\nLead ${p('id')} · contacto ${p('contact_id')}${owner}`;
    }
    case 'lead.close_requested':
      return `Cierre solicitado por un closer.\nLead ${p('lead_id')} · contacto ${p('contact_id')} · closer ${p('owner_id')}`;
    case 'lead.owner_collision':
      return `Colisión de cartera: el email de un lead web coincide con un contacto de un closer. Revísalo antes de contestar.\nLead ${p('lead_id')} · contacto nuevo ${p('contact_id')} · contacto existente ${p('existing_contact_id')}`;
    case 'crm.import_done':
      return `Importación terminada: ${p('created')} creados, ${p('updated')} actualizados, ${p('skipped')} omitidos, ${p('conflicts')} en conflicto.\nImportación ${p('import_id')}`;
    case 'crm.import_conflicts':
      return `Importación con ${p('conflicts')} filas en conflicto pendientes de tu decisión.\nImportación ${p('import_id')} · importador ${p('owner_id')}`;
    case 'crm.import_conflict_resolved':
      return `Conflicto de importación resuelto: ${payload.outcome === 'assigned' ? 'asignado a ti' : 'no asignado'}.\nConflicto ${p('conflict_id')}`;
    case 'quote.sent':
      return `Presupuesto enviado por un closer (total ${p('total')} € sin IVA).\nPresupuesto ${p('quote_id')} · contacto ${p('contact_id')}`;
    case 'staff.claimed':
      return `Alta de staff: ${p('role')} ha activado su acceso.\nUsuario ${p('user_id')}`;
    case 'story.proposed':
      return `Historia propuesta por un cliente: ${quoted(payload, 'title')}.\nHistoria ${p('story_id')} · cliente ${p('client_id')}`;
    case 'story.decided':
      return `Historia decidida (${p('status')}).\nHistoria ${p('story_id')} · cliente ${p('client_id')}`;
    case 'comment.client':
      return `Comentario nuevo de un cliente en una tarea.\nComentario ${p('id')} · cliente ${p('client_id')} · tarea ${p('task_id')}`;
    case 'commission.created':
    case 'commission.approved':
    case 'commission.paid':
    case 'commission.rejected':
      return `Comisión ${COMMISSION_STATE[event]}: ${p('amount')} €.\nComisión ${p('commission_id')} · closer ${p('closer_id')}`;
    case 'content.deployed':
      return `Contenido publicado y desplegado.\nPublicación ${p('publication_id')} · commit ${shortSha(payload.commit_sha)}`;
    case 'content.deploy_failed':
      return `La publicación de contenido ha fallado: ${quoted(payload, 'error')}.\nPublicación ${p('publication_id')} · commit ${shortSha(payload.commit_sha)}`;
    case 'comment.pending':
      return `Comentario pendiente de moderar de ${quoted(payload, 'author_name')} en ${quoted(payload, 'post_slug')} (${p('locale')}).\nComentario ${p('id')}`;
    case 'asset.uploaded':
      return `Material nuevo del cliente ${p('client_id')}: ${quoted(payload, 'file_name')} (${p('size_bytes')} bytes).\nFichero ${p('id')}`;
    case 'upgrade.requested':
      return `Ampliación solicitada: ${p('from_pack_code')} → ${p('to_pack_code')} (${p('computed_price')} €).\nCliente ${p('client_id')} · solicitud ${p('id')}`;
    case 'chat.visitor_message':
      return `Mensaje nuevo en el chat (${p('case')}, ${p('locale')}).\nHilo ${p('thread_id')}`;
    case 'system.outbox_dead':
      return `Aviso perdido tras 10 intentos: ${p('event')} #${p('id')}.\nÚltimo error: ${p('last_error')}`;
    default:
      // unknown event: its name and id only, never the payload
      return `${event.slice(0, MAX_FIELD)}\nid ${p('id')}`;
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown';
}

export const drainOutbox: JobHandler = async ({ deps, budget }) => {
  const { outbox, telegram, notices, quota } = deps;
  // Without a channel nothing is claimed: a claim spends one of the event's 10 attempts.
  if (!outbox || !telegram) {
    console.warn(
      JSON.stringify({ scope: 'scheduled', job: OUTBOX_DRAIN, skipped: !outbox ? 'no SUPABASE_SECRET_KEY' : 'no Telegram' }),
    );
    return;
  }

  const limit = batchLimit(budget.remaining);
  if (limit < 1) return;
  const worker = `${OUTBOX_DRAIN}:${crypto.randomUUID()}`;

  budget.take();
  const events = await outbox.claim(limit, worker);
  if (events.length === 0) return;
  budget.reserve();

  const delivered: number[] = [];
  try {
    for (const event of events) {
      try {
        const thread = groupingThread(event);
        if (thread && quota) {
          // chat notices are grouped: one per thread every 10 minutes (the rest of the burst is acked unsent)
          budget.take();
          if (!(await quota.hit(`chatnotify:${thread}`, 1, CHAT_NOTICE_WINDOW_SECONDS))) {
            delivered.push(event.id);
            continue;
          }
        } else {
          // already told by the request that created it (lead, chat): nothing more to send
          const key = noticeKey(event);
          if (key && notices) {
            budget.take();
            if (await notices.wasSent(key)) {
              delivered.push(event.id);
              continue;
            }
          }
        }

        const recipients = await resolveRecipients(deps, event.event, event.payload, { beforeFetch: () => budget.take() });
        // an event is started only if every message of it fits (and one more call for `outbox_fail`); otherwise it
        // waits claimed until the claim expires, which costs one attempt of ten but never a half-sent event
        if (budget.remaining < recipients.length + 1) {
          console.warn(JSON.stringify({ scope: 'scheduled', job: OUTBOX_DRAIN, deferred: event.id }));
          break;
        }
        await deliverAll(deps, event, recipients, formatOutboxEvent(event), () => budget.take());
        delivered.push(event.id);
      } catch (error) {
        budget.take();
        await outbox.fail(event.id, worker, errorText(error));
      }
    }
  } finally {
    // delivered events are acked even if recording a failure threw: otherwise they would be sent again
    budget.takeReserved();
    await outbox.ack(delivered, worker);
  }
};
