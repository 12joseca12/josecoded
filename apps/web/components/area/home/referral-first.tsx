import { getTranslations } from 'next-intl/server';

import { AreaCard } from '@/components/area/area-card';
import { Button } from '@/components/ui/button';

import styles from './home.module.css';

import type { Locale } from '@josecoded/types';

/** Home of someone who arrived through a referral link: their own link first, then «want a website?». */
export async function ReferralFirst({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'area.home.referral' });
  return (
    <>
      <AreaCard id="area-referral" title={t('cta')} span="full">
        <p>{t('lede')}</p>
        <div className={styles.actions}>
          <Button href="/area-clientes/recomiendame">{t('cta')}</Button>
        </div>
      </AreaCard>
      <AreaCard id="area-want-web" title={t('wantWebTitle')}>
        <p>{t('wantWebBody')}</p>
        <div className={styles.actions}>
          <Button href="/servicios#packs" variant="ghost">
            {t('wantWebCta')}
          </Button>
        </div>
      </AreaCard>
    </>
  );
}
