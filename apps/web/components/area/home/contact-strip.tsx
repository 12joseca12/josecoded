import { getTranslations } from 'next-intl/server';

import { AreaCard } from '@/components/area/area-card';
import { Button } from '@/components/ui/button';
import { bookingHref, whatsappHref } from '@/lib/area/contact';

import styles from './home.module.css';

import type { Locale } from '@josecoded/types';

/** The way to reach Jose; every variant of the home shows it (the area never hides contact). */
export async function ContactStrip({ locale, whatsappText }: { locale: Locale; whatsappText?: string }) {
  const t = await getTranslations({ locale, namespace: 'area.contact' });
  return (
    <AreaCard id="area-contact" title={t('title')} tone="quiet" span="full">
      <p>{t('body')}</p>
      <div className={styles.actions}>
        <Button href={whatsappHref(whatsappText)} variant="ghost">
          {t('whatsapp')}
        </Button>
        <Button href={bookingHref()} variant="ghost">
          {t('book')}
        </Button>
        <Button href="/contacto" variant="ghost">
          {t('page')}
        </Button>
      </div>
    </AreaCard>
  );
}
