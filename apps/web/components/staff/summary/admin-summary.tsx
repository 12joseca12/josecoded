import { getFormatter, getTranslations } from 'next-intl/server';

import { OmenStatus } from '@/components/staff/omen-status';
import { StatList, StatRow } from '@/components/staff/stat-list';
import { SummaryCard } from '@/components/staff/summary-card';
import { ArrowLink } from '@/components/ui/arrow-link';
import { getAdminCounters, getOmenStatus } from '@/lib/admin/queries';

import styles from './summary.module.css';

import type { AdminCounters, Href, Locale } from '@josecoded/types';

// Counters of C1 in the order of the prototype. A counter links only where its screen is planned (the rest are
// read-only rows until their tasks land: 6.3–6.5 moderation, chat, quotes).
const COUNTERS: readonly { key: keyof AdminCounters; href?: Href }[] = [
  { key: 'chat_unread' },
  { key: 'agencies_replied' },
  { key: 'leads_open', href: '/crm/contactos' },
  { key: 'contacts_due', href: '/crm/contactos' },
  { key: 'comments_pending' },
  { key: 'upgrades_pending' },
  { key: 'rewards_pending' },
  { key: 'stories_proposed', href: '/crm/clientes' },
  { key: 'commissions_pending', href: '/crm/comisiones' },
  { key: 'import_conflicts_pending', href: '/crm/importar?tab=conflictos' },
  { key: 'imports_failed_24h' },
  { key: 'content_pending', href: '/admin/contenido' },
  { key: 'quotes_draft' },
];

/**
 * C1: the 13 counters of `admin_counters()` and the state of Omen (hidden when the gateway has no Omen), in one cell. It is the whole of `/admin` and
 * the closing cell of K1 for the admin (README §4 H). One RPC call and one gateway call per render (`cache`).
 */
export async function AdminSummary({ locale }: { locale: Locale }) {
  const [t, format, counters, omen] = await Promise.all([
    getTranslations({ locale, namespace: 'crm' }),
    getFormatter({ locale }),
    getAdminCounters(),
    getOmenStatus(),
  ]);
  return (
    <SummaryCard
      icon="shield-check"
      title={t('admin.title')}
      cols={12}
      aside={omen === 'unconfigured' ? undefined : <OmenStatus status={omen} label={t(`admin.omen.${omen}`)} />}
    >
      <StatList columns>
        {COUNTERS.map(({ key, href }) => (
          <StatRow key={key} label={t(`admin.counters.${key}`)} value={format.number(counters[key])} href={href} />
        ))}
      </StatList>
      <div className={styles.actions}>
        <ArrowLink href="/admin/equipo">{t('admin.link')}</ArrowLink>
      </div>
    </SummaryCard>
  );
}
