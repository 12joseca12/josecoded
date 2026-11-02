import { getTranslations } from 'next-intl/server';

import { Action } from '@/components/ui/action';
import { PREVIEWS } from '@/lib/dev/crm-previews';

import styles from './crm-preview.module.css';

import type { Locale } from '@josecoded/types';

/** Index of `/dev/crm`: a link per screen and role. Dev only (the route is gated). */
export async function CrmPreviewIndex({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'dev.crm' });
  return (
    <main id="main" className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.text}>{t('intro')}</p>
      </header>
      <ul role="list" className={styles.list}>
        {PREVIEWS.map(({ screen, role }) => (
          <li key={`${screen}-${role}`}>
            <Action href={`/dev/crm/${screen}/${role}`} className={styles.link}>
              <span className={styles.name}>{t(`screens.${screen}`)}</span>
              <span className={styles.role}>{t(`roles.${role}`)}</span>
            </Action>
          </li>
        ))}
      </ul>
      <p className={styles.text}>{t('note')}</p>
    </main>
  );
}
