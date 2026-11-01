import { getTranslations } from 'next-intl/server';

import { AreaCard } from '@/components/area/area-card';
import { Button } from '@/components/ui/button';
import { bookingHref } from '@/lib/area/contact';
import { hasDato } from '@/lib/content/dato';

import styles from './home.module.css';

import type { Locale } from '@josecoded/types';

/** Home of someone who came as a hiring team: CV, a 20-minute call, the assistant and the work. */
export async function CompanyFirst({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'area.home.company' });
  const tFacts = await getTranslations({ locale, namespace: 'facts' });
  const cv = tFacts('cvUrl');
  return (
    <AreaCard id="area-company" title={t('title.lead')} span="full">
      <p>{t('lede')}</p>
      <div className={styles.actions}>
        <Button href={bookingHref()}>{t('book')}</Button>
        {hasDato(cv) ? (
          <Button href={cv as `https://${string}`} variant="ghost" icon="download">
            {t('cv')}
          </Button>
        ) : null}
        <Button href="/chat" variant="ghost">
          {t('chat')}
        </Button>
        <Button href="/proyectos" variant="ghost">
          {t('projects')}
        </Button>
      </div>
    </AreaCard>
  );
}
