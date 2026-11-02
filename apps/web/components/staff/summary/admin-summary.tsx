import { getFormatter, getTranslations } from 'next-intl/server';

import { OmenStatus } from '@/components/staff/omen-status';
import { StatList, StatRow } from '@/components/staff/stat-list';
import { SummaryCard } from '@/components/staff/summary-card';
import { ArrowLink } from '@/components/ui/arrow-link';
import { relativeFromNow } from '@/lib/crm/next-action';

import styles from './summary.module.css';

import type { OmenStatus as OmenState } from '@/lib/admin/queries';
import type { AdminCounters, Href, IconName, Locale } from '@josecoded/types';

// Counters of C1 in the order of the prototype. A counter links only where its screen is planned (the rest are
// read-only rows until their tasks land: 6.3–6.5 moderation, chat, quotes).
type CounterKey = keyof AdminCounters;

const COUNTERS: readonly { key: CounterKey; icon: IconName; href?: Href }[] = [
  { key: 'chat_unread', icon: 'message-square' },
  { key: 'agencies_replied', icon: 'building-2' },
  { key: 'leads_open', icon: 'inbox', href: '/crm/contactos' },
  { key: 'contacts_due', icon: 'clock', href: '/crm/contactos' },
  { key: 'comments_pending', icon: 'message-square' },
  { key: 'upgrades_pending', icon: 'file-up' },
  { key: 'rewards_pending', icon: 'receipt' },
  { key: 'stories_proposed', icon: 'list-checks', href: '/crm/clientes' },
  { key: 'commissions_pending', icon: 'wallet', href: '/crm/comisiones' },
  { key: 'import_conflicts_pending', icon: 'git-merge', href: '/crm/importar?tab=conflictos' },
  { key: 'imports_failed_24h', icon: 'circle-x' },
  { key: 'content_pending', icon: 'layers', href: '/admin/contenido' },
  { key: 'quotes_draft', icon: 'file-text' },
];

/**
 * C1: the 13 counters of `admin_counters()` and the state of Omen (hidden when the gateway has no Omen), in one cell. It is the whole of `/admin` and
 * the closing cell of K1 for the admin (README §4 H). The page reads `admin_counters()` and the state of Omen
 * (one RPC and one gateway call per render, `cache`) and hands them in, so the dev previews feed the same view fixtures.
 * `omit` leaves counters out where another cell already says them (K1 has the overdue ones in its first cell).
 */
export async function AdminSummary({
  locale,
  counters,
  omen,
  omenCheckedAt,
  omit = [],
}: {
  locale: Locale;
  counters: AdminCounters;
  omen: OmenState;
  /** When Omen was asked; the card says how long ago. */
  omenCheckedAt?: Date;
  omit?: readonly CounterKey[];
}) {
  const [t, format] = await Promise.all([
    getTranslations({ locale, namespace: 'crm' }),
    getFormatter({ locale }),
  ]);
  return (
    <SummaryCard
      icon="shield-check"
      title={t('admin.title')}
      cols={12}
      aside={
        omen === 'unconfigured' ? undefined : (
          <OmenStatus
            status={omen}
            label={t(`admin.omen.${omen}Checked`, {
              ago: relativeFromNow(
                (omenCheckedAt ?? new Date()).toISOString(),
                new Date(),
                locale,
                'short',
              ),
            })}
          />
        )
      }
    >
      <StatList columns>
        {COUNTERS.filter(({ key }) => !omit.includes(key)).map(({ key, icon, href }) => (
          <StatRow
            key={key}
            icon={icon}
            label={t(`admin.counters.${key}`)}
            value={format.number(counters[key])}
            href={href}
          />
        ))}
      </StatList>
      <div className={styles.actions}>
        <ArrowLink size="label" href="/admin/equipo">{t('admin.link')}</ArrowLink>
      </div>
    </SummaryCard>
  );
}
