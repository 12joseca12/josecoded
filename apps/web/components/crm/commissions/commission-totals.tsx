import { getFormatter, getTranslations } from 'next-intl/server';

import { Action } from '@/components/ui/action';
import {
  commissionTone,
  commissionsHref,
  MONEY_FORMAT,
  STATUS_ORDER,
} from '@/lib/crm/commissions';

import styles from './commission-totals.module.css';

import type { CommissionQuery, StatusTotal } from '@/lib/crm/commissions';
import type { CommissionStatus, Locale } from '@josecoded/types';

/**
 * The totals of K5: cells, no chart. One per status with the amount and how many commissions it adds up, and each
 * one a link to the list filtered by that status; the one that is on is marked with `aria-current` and links back to
 * the unfiltered list. The totals always count every status of the closers in view, whatever the list shows.
 */
export async function CommissionTotals({
  totals,
  query,
  locale,
}: {
  totals: Record<CommissionStatus, StatusTotal>;
  query: CommissionQuery;
  locale: Locale;
}) {
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: 'crmCommissions.totals' }), getFormatter({ locale })]);
  return (
    <div className={styles.totals} role="group" aria-label={t('label')}>
      {STATUS_ORDER.map((status) => {
        const tone = commissionTone(status);
        const on = query.status === status;
        return (
          <Action
            key={status}
            href={commissionsHref(query, { status: on ? null : status }) as `/${string}`}
            className={styles.tile}
            aria-current={on ? 'true' : undefined}
            data-tone={tone === 'attention' || tone === 'live' ? tone : undefined}
          >
            <span>{t(status)}</span>
            <b className={styles.figure}>{format.number(totals[status].amount, MONEY_FORMAT)}</b>
            <small className={styles.count}>{t('count', { count: totals[status].count })}</small>
          </Action>
        );
      })}
    </div>
  );
}
