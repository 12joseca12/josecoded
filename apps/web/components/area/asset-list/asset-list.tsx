import { getFormatter, getTranslations } from 'next-intl/server';

import { downloadAsset } from '@/app/[locale]/(area)/area-clientes/material/actions';
import { AreaEmpty } from '@/components/area/area-empty';
import { Field } from '@/components/forms/field';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/area/assets';

import styles from './asset-list.module.css';

import type { AreaAsset } from '@/lib/area/queries';
import type { Locale } from '@josecoded/types';


/**
 * Files of the project, theirs and Jose's. Each download is its own form posting to the action, which
 * answers with a 60-second signed URL (it works without JavaScript and the URL never sits in the
 * page). The visible name is the stored label, escaped as text.
 *
 * A11y: a list; every button names its file («Descargar informe.pdf») so the buttons are
 * distinguishable out of context; the origin («Tuyo» / «De Jose») is text, not only a colour.
 */
export async function AssetList({ locale, assets }: { locale: Locale; assets: readonly AreaAsset[] }) {
  const t = await getTranslations({ locale, namespace: 'area.files' });
  const format = await getFormatter({ locale });

  if (assets.length === 0) return <AreaEmpty title={t('emptyTitle')}>{t('emptyBody')}</AreaEmpty>;

  return (
    <ul className={styles.list} aria-label={t('listLabel')}>
      {assets.map((asset) => {
        const name = asset.title || asset.file_name || t('unnamed');
        return (
          <li key={asset.id} className={styles.item}>
            <div className={styles.info}>
              <span className={styles.name}>{name}</span>
              <span className={styles.meta}>
                {t('meta', {
                  origin: asset.source === 'client' ? t('mine') : t('fromJose'),
                  size: formatBytes(asset.size_bytes ?? 0, locale),
                  date: format.dateTime(new Date(asset.created_at), { dateStyle: 'medium', timeZone: 'Europe/Madrid' }),
                })}
              </span>
            </div>
            <form action={downloadAsset}>
              <Field kind="hidden" name="assetId" value={asset.id} />
              <Field kind="hidden" name="locale" value={locale} />
              <Button type="submit" variant="ghost" size="sm" icon="download">
                {t('download', { name })}
              </Button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
