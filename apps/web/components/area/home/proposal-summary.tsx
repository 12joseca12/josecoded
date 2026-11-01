import { getFormatter, getTranslations } from 'next-intl/server';

import { formatPrice } from '@josecoded/pricing';

import { AreaCard } from '@/components/area/area-card';
import { Button } from '@/components/ui/button';
import { whatsappHref } from '@/lib/area/contact';
import { packLabel } from '@/lib/area/packs';

import styles from './home.module.css';

import type { AreaLead } from '@/lib/area/queries';
import type { Locale } from '@josecoded/types';

/** Home of someone with a proposal (variant `proposal`): pack, «from» price, state and the way to talk. */
export async function ProposalSummary({ locale, lead }: { locale: Locale; lead: AreaLead }) {
  const t = await getTranslations({ locale, namespace: 'area.home.proposal' });
  const format = await getFormatter({ locale });

  return (
    <AreaCard id="area-proposal" title={t('pack')} span="full">
      <div className={styles.fact}>
        <span className={styles.big}>{packLabel(lead.pack_code, locale)}</span>
        <span>{t('from', { price: formatPrice(lead.price_from, locale) })}</span>
      </div>
      <p className={styles.muted}>
        {t('statusLine', {
          status: t(`status.${lead.status}`),
          date: format.dateTime(new Date(lead.created_at), { dateStyle: 'medium', timeZone: 'Europe/Madrid' }),
        })}
      </p>
      <div className={styles.actions}>
        <Button href={whatsappHref()}>{t('ask')}</Button>
      </div>
    </AreaCard>
  );
}
