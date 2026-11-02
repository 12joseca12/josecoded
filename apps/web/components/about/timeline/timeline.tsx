import { Pending, isPendingVisible } from '@/components/ui/pending';
import { isPendingDato } from '@/lib/content/dato';

import styles from './timeline.module.css';

export interface TimelineEntry {
  id: string;
  label: string;
  /** `2026` or `2026-09`; anything else (a `{{DATO}}`) is a pending date. */
  date: string;
}

const REAL_DATE = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

function formatDate(date: string, locale: 'es' | 'en'): string {
  const [year, month] = date.split('-');
  if (!month) return year ?? date;
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(Number(year), Number(month) - 1, 1)));
}

/**
 * The path in order: only entries with a real date are listed, oldest first, because a date nobody
 * gave is not a fact (nothing here is invented). In development the pending ones show as markers so
 * the gaps are visible; in production they are simply absent.
 *
 * A11y: an ordered list; each date sits in a `time` with its machine value.
 */
export function Timeline({ entries, locale, label }: { entries: readonly TimelineEntry[]; locale: 'es' | 'en'; label?: string }) {
  const real = entries.filter((entry) => REAL_DATE.test(entry.date) && !isPendingDato(entry.label)).sort((a, b) => a.date.localeCompare(b.date));
  const pending = isPendingVisible() ? entries.filter((entry) => !REAL_DATE.test(entry.date) || isPendingDato(entry.label)) : [];
  if (real.length === 0 && pending.length === 0) return null;
  return (
    <ol className={styles.list} aria-label={label}>
      {real.map((entry) => (
        <li key={entry.id} className={styles.item}>
          <time dateTime={entry.date} className={styles.date}>
            {formatDate(entry.date, locale)}
          </time>
          <span className={styles.label}>{entry.label}</span>
        </li>
      ))}
      {pending.map((entry) => (
        <li key={entry.id} className={styles.item} data-pending="">
          <Pending>{isPendingDato(entry.label) ? entry.label : `${entry.label} ${entry.date}`}</Pending>
        </li>
      ))}
    </ol>
  );
}
