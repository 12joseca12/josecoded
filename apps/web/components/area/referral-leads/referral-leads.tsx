import { getFormatter, getTranslations } from 'next-intl/server';

import { AreaEmpty } from '@/components/area/area-empty';
import { packLabel } from '@/lib/area/packs';

import styles from './referral-leads.module.css';

import type { AreaReferredLead } from '@/lib/area/queries';
import type { Locale } from '@josecoded/types';

/** Recommendations that reached Jose: pack, state and date. No name, no email, no phone: the view never has them. */
export async function ReferralLeads({ locale, leads }: { locale: Locale; leads: readonly AreaReferredLead[] }) {
  const t = await getTranslations({ locale, namespace: 'area.referrals' });
  const format = await getFormatter({ locale });

  if (leads.length === 0) return <AreaEmpty title={t('leadsEmptyTitle')}>{t('leadsEmptyBody')}</AreaEmpty>;

  return (
    <ul className={styles.list} aria-label={t('leadsList')}>
      {leads.map((lead) => (
        <li key={lead.lead_id} className={styles.item}>
          <span>{packLabel(lead.pack_code, locale)}</span>
          <span className={styles.meta}>
            {t('leadLine', {
              status: t(`leadStatus.${lead.status}`),
              date: format.dateTime(new Date(lead.created_at), { dateStyle: 'medium', timeZone: 'Europe/Madrid' }),
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
