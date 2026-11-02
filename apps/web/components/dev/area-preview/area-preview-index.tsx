import { getTranslations } from 'next-intl/server';

import { Action } from '@/components/ui/action';
import { AREA_STORY_STATES } from '@/lib/dev/area-previews';

import styles from '../crm-preview/crm-preview.module.css'; // same dev index look as /dev/crm

import type { Locale } from '@josecoded/types';

/** Index of `/dev/area/historias`: a link per state. Dev only (the route is gated). */
export async function AreaPreviewIndex({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'dev.areaStories' });
  return (
    <main id="main" className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.text}>{t('intro')}</p>
      </header>
      <ul role="list" className={styles.list}>
        {AREA_STORY_STATES.map((state) => (
          <li key={state}>
            <Action href={`/dev/area/historias/${state}`} className={styles.link}>
              <span>{t(`states.${state}`)}</span>
              <span className={styles.role}>{state}</span>
            </Action>
          </li>
        ))}
      </ul>
      <p className={styles.text}>{t('note')}</p>
    </main>
  );
}
