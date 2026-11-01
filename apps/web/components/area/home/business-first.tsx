import { getTranslations } from 'next-intl/server';

import { formatPrice, pricing } from '@josecoded/pricing';

import { AreaCard } from '@/components/area/area-card';
import { Button } from '@/components/ui/button';
import { whatsappHref } from '@/lib/area/contact';
import { packLabel } from '@/lib/area/packs';

import styles from './home.module.css';

import type { Locale } from '@josecoded/types';

/** Home of someone who came from the business pages: the four packs in short, with the way to ask. */
export async function BusinessFirst({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'area.home.business' });
  const tContact = await getTranslations({ locale, namespace: 'area.contact' });
  return (
    <AreaCard id="area-packs" title={t('packsLabel')} span="full">
      <ul className={styles.packs}>
        {pricing.packs.map((pack) => (
          <li key={pack.code} className={styles.pack}>
            <span>{packLabel(pack.code, locale)}</span>
            <span className={styles.muted}>
              {t('packLine', { weeks: pack.weeks, price: formatPrice(pack.price, locale) })}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        <Button href="/propuesta">{t('request')}</Button>
        <Button href="/servicios#packs" variant="ghost">
          {t('seePacks')}
        </Button>
        <Button href={whatsappHref()} variant="ghost">
          {tContact('whatsapp')}
        </Button>
      </div>
    </AreaCard>
  );
}
