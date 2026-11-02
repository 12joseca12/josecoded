import { getFormatter, getTranslations } from 'next-intl/server';

import { Icon } from '@/components/ui/icon';

import styles from './interaction-timeline.module.css';

import type { InteractionRecord } from '@/lib/crm/contact-detail';
import type { StatusKey } from '@/lib/crm/status';
import type { IconName, Locale } from '@josecoded/types';

type Look = { icon: IconName; tone: 'plain' | 'in' | 'status' };

const LOOK: Record<InteractionRecord['kind'], Look> = {
  note: { icon: 'pen-line', tone: 'plain' },
  message_sent: { icon: 'send', tone: 'plain' },
  message_received: { icon: 'message-square', tone: 'in' },
  meeting: { icon: 'calendar', tone: 'plain' },
  call: { icon: 'phone', tone: 'plain' },
  chat_thread: { icon: 'message-circle', tone: 'in' },
  status_change: { icon: 'circle-check', tone: 'status' },
  import: { icon: 'upload', tone: 'status' },
  lead_created: { icon: 'inbox', tone: 'status' },
  lead_won: { icon: 'circle-check', tone: 'status' },
  lead_lost: { icon: 'circle-x', tone: 'status' },
  client_invited: { icon: 'key-round', tone: 'status' },
  story_proposed: { icon: 'list-checks', tone: 'in' },
  story_decided: { icon: 'list-checks', tone: 'status' },
  commission: { icon: 'wallet', tone: 'status' },
};

/** Text-carrying kinds get a box for the body; the bookkeeping ones are one line. */
const BOXED = new Set<InteractionRecord['kind']>(['note', 'message_received', 'message_sent', 'meeting', 'call', 'story_proposed']);

const asRecord = (payload: unknown): Record<string, unknown> =>
  payload && typeof payload === 'object' && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};

/**
 * The history of a contact, newest first (K3). Each line says what happened, who did it and when; the state is
 * never the colour or the icon alone. A change of status reads «Estado: A → B».
 *
 * A11y: an ordered list with a heading above it; times are `<time>` elements.
 */
export async function InteractionTimeline({ items, locale }: { items: readonly InteractionRecord[]; locale: Locale }) {
  const [t, tStatus, tChannel, format] = await Promise.all([
    getTranslations({ locale, namespace: 'crmContacts.timeline' }),
    getTranslations({ locale, namespace: 'crmContacts.status' }),
    getTranslations({ locale, namespace: 'crmContacts.channels' }),
    getFormatter({ locale }),
  ]);
  const status = (value: unknown) =>
    typeof value === 'string' && tStatus.has(value as StatusKey) ? tStatus(value as StatusKey) : String(value ?? '—');
  const euros = (value: unknown) => (typeof value === 'number' ? format.number(value, { style: 'currency', currency: 'EUR' }) : '');

  if (items.length === 0) return <p className={styles.empty}>{t('empty')}</p>;

  return (
    <ol className={styles.timeline} role="list">
      {items.map((item) => {
        const look = LOOK[item.kind];
        const payload = asRecord(item.payload);
        const channel = item.channel ? tChannel(item.channel) : null;
        const when = new Date(item.occurred_at);
        let line: string;
        // what follows the kind on the same line («WhatsApp», «Tu propuesta»): never in the box
        let inline: string[] = [];
        let detail: string | null = item.body;
        switch (item.kind) {
          case 'status_change':
            line = '';
            detail = null;
            break;
          case 'lead_won':
            line = t('line.lead_won', { amount: euros(payload.amount) });
            detail = null;
            break;
          case 'commission':
            line = t('line.commission', { percent: String(payload.percent ?? ''), amount: euros(payload.amount) });
            detail = null;
            break;
          case 'message_sent':
          case 'message_received':
            line = t(`kind.${item.kind}`);
            inline = [
              channel,
              item.subject ? t('line.subject', { subject: item.subject }) : null,
            ].filter((part): part is string => part !== null);
            break;
          default:
            line = t(`kind.${item.kind}`);
        }
        return (
          <li key={item.id} className={styles.item} data-tone={look.tone}>
            <span className={styles.icon} aria-hidden="true">
              <Icon name={look.icon} />
            </span>
            <div className={styles.body}>
              <p className={styles.line}>
                {item.kind === 'status_change' ? (
                  <span>
                    {t.rich('line.status_change', {
                      from: status(payload.from),
                      to: status(payload.to),
                      b: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </span>
                ) : (
                  <strong>{line}</strong>
                )}
                {inline.map((part) => (
                  <span key={part} className={styles.inline}>
                    {part}
                  </span>
                ))}
                <span className={styles.inline}>{t(`actor.${item.actor}`)}</span>
                <time className={styles.time} dateTime={item.occurred_at}>
                  {format.dateTime(when, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}
                </time>
              </p>
              {detail && BOXED.has(item.kind) ? <p className={styles.text}>{detail}</p> : detail ? <p className={styles.plain}>{detail}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
