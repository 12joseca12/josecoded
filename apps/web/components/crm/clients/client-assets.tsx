import { getTranslations } from 'next-intl/server';

import { Icon } from '@/components/ui/icon';
import { formatBytes } from '@/lib/area/assets';

import { DetailCard } from '../detail-card';
import styles from './client-detail.module.css';

import type { ClientAsset } from '@/lib/crm/client-queries';
import type { Locale } from '@josecoded/types';

/** What the client uploaded, for the admin only: a closer is never given the list (nor the files). */
export async function ClientAssets({ assets, locale }: { assets: readonly ClientAsset[]; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'crmClients.file.assets' });
  return (
    <DetailCard icon="folder-kanban" title={t('title')}>
      {assets.length === 0 ? (
        <p className={styles.hint}>{t('empty')}</p>
      ) : (
        <ul className={styles.items} role="list">
          {assets.map((asset) => (
            <li key={asset.id} className={styles.item}>
              <Icon name="file-text" />
              <span className={styles.name}>{asset.name}</span>
              {asset.sizeBytes !== null ? <small className={styles.size}>{formatBytes(asset.sizeBytes, locale)}</small> : null}
            </li>
          ))}
        </ul>
      )}
    </DetailCard>
  );
}
