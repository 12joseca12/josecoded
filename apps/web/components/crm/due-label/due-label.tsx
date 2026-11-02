import { getFormatter, getTranslations } from 'next-intl/server';

import { Icon } from '@/components/ui/icon';
import { dueState, relativeFromNow } from '@/lib/crm/next-action';

import styles from './due-label.module.css';

import type { Locale } from '@josecoded/types';

/**
 * When the next action is due, as the inbox and the detail show it. Overdue carries an icon and a hidden «Vencida:»
 * for screen readers (the colour is never the only signal); «hoy» is plain emphasis; no date shows nothing.
 * `relative` writes an overdue date as how late it is («hace 3 días», the short lists); the table keeps the day.
 */
export async function DueLabel({
  at,
  locale,
  now,
  relative = false,
}: {
  at: string | null;
  locale: Locale;
  now?: Date;
  relative?: boolean;
}) {
  const state = dueState(at, now);
  if (state === 'none' || !at) return null;
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: 'crmContacts.due' }), getFormatter({ locale })]);
  const day = format.dateTime(new Date(at), { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' });
  return (
    <span className={styles.due} data-state={state}>
      {state === 'overdue' ? <Icon name="triangle-alert" /> : null}
      {state === 'today' ? <Icon name="clock" /> : null}
      <span className="sr-only">
        {t(state === 'overdue' ? 'overdue' : state === 'today' ? 'today' : 'later')}{' '}
      </span>
      {state === 'today'
        ? t('todayLabel')
        : relative && state === 'overdue'
          ? relativeFromNow(at, now, locale)
          : day}
    </span>
  );
}
