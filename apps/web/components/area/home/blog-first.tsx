import { getTranslations } from 'next-intl/server';

import { AreaCard } from '@/components/area/area-card';
import { Button } from '@/components/ui/button';

import styles from './home.module.css';

import type { Locale } from '@josecoded/types';

/** Home of someone who signed up from a blog guide: back to reading, or on to the lab. */
export async function BlogFirst({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'area.home.blog' });
  return (
    <AreaCard id="area-blog" title={t('back')} span="full">
      <p>{t('lede')}</p>
      <div className={styles.actions}>
        <Button href="/blog">{t('back')}</Button>
        <Button href="/lab" variant="ghost">
          {t('lab')}
        </Button>
      </div>
    </AreaCard>
  );
}
