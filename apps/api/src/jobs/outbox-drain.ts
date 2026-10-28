// Job `outbox.drain` (`* * * * *`: every tick of the `*/5` Cron Trigger; DATOS §4.7, §8.4, Q2). Claims the live
// events of `private.outbox`, tells Jose about each one by Telegram and acks the delivered ones; a failed delivery
// is recorded with `outbox_fail` and retried on a later tick. After the 10th attempt the SQL dead-letters the
// event and enqueues `system.outbox_dead`, which this same job delivers on the next tick.
import type { JobHandler } from './job';
import type { OutboxEvent } from '@josecoded/types';

export const OUTBOX_DRAIN = 'outbox.drain';

/** Events per tick. Telegram allows about one message per second to one chat; the rest waits five minutes. */
export const MAX_BATCH = 20;
/** Worst case per event: the once-only probe, the Telegram call and `outbox_fail`. */
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

/**
 * Events that may already have been notified by the request that created them (`POST /leads`, the chat): their
 * once-only key is `<event>:<payload.id>` (NoticeLedger). `undefined` for the rest.
 */
export function noticeKey(event: OutboxEvent): string | undefined {
  if (event.event !== 'lead.created' && !event.event.startsWith('chat.')) return undefined;
  const id = event.payload.id;
  return typeof id === 'string' || typeof id === 'number' ? `${event.event}:${id}` : undefined;
}

/** Plain-text Telegram message for Jose. Payloads carry ids and short fields only, never message content. */
export function formatOutboxEvent({ event, payload }: OutboxEvent): string {
  const p = (key: string) => text(payload, key);
  switch (event) {
    case 'lead.created': {
      const pack = typeof payload.pack_code === 'string' ? ` · ${payload.pack_code}` : '';
      return `Nuevo lead (${p('source')}${pack}).\nLead ${p('id')} · contacto ${p('contact_id')}`;
    }
    case 'comment.pending':
      return `Comentario pendiente de moderar de ${p('author_name')} en ${p('post_slug')} (${p('locale')}).\nComentario ${p('id')}`;
    case 'asset.uploaded':
      return `Material nuevo del cliente ${p('client_id')}: ${p('file_name')} (${p('size_bytes')} bytes).\nFichero ${p('id')}`;
    case 'upgrade.requested':
      return `Ampliación solicitada: ${p('from_pack_code')} → ${p('to_pack_code')} (${p('computed_price')} €).\nCliente ${p('client_id')} · solicitud ${p('id')}`;
    case 'chat.visitor_message':
      return `Mensaje nuevo en el chat (${p('case')}, ${p('locale')}).\nHilo ${p('thread_id')}`;
    case 'system.outbox_dead':
      return `Aviso perdido tras 10 intentos: ${p('event')} #${p('id')}.\nÚltimo error: ${p('last_error')}`;
    default:
      return `${event}\n${JSON.stringify(payload).slice(0, 500)}`;
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown';
}

export const drainOutbox: JobHandler = async ({ deps, budget }) => {
  const { outbox, telegram, notices } = deps;
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
        const key = noticeKey(event);
        if (key && notices) {
          budget.take();
          if (await notices.wasSent(key)) {
            delivered.push(event.id);
            continue;
          }
        }
        budget.take();
        await telegram.sendMessage(formatOutboxEvent(event));
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
