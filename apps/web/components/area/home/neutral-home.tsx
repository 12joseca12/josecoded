import { getTranslations } from 'next-intl/server';

import { AreaCard } from '@/components/area/area-card';
import { Button } from '@/components/ui/button';

import styles from './home.module.css';

import type { Locale } from '@josecoded/types';

/** Home without a clear origin: two doors of the same weight (one violet action per view: both ghost). */
export async function NeutralHome({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'area.home.neutral' });
  return (
    <>
      <AreaCard id="area-door-project" title={t('projectTitle')}>
        <p>{t('projectBody')}</p>
        <div className={styles.actions}>
          <Button href="/servicios" variant="ghost">
            {t('projectCta')}
          </Button>
        </div>
      </AreaCard>
      <AreaCard id="area-door-talk" title={t('talkTitle')}>
        <p>{t('talkBody')}</p>
        <div className={styles.actions}>
          <Button href="/sobre-mi" variant="ghost">
            {t('talkCta')}
          </Button>
        </div>
      </AreaCard>
    </>
  );
}
