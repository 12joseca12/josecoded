import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { AreaCard, AreaGrid } from '@/components/area/area-card';
import { AssetList } from '@/components/area/asset-list';
import { AssetUpload } from '@/components/area/asset-upload';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import { getPathname } from '@/i18n/navigation';
import { getAreaContext, getAssets } from '@/lib/area/queries';
import { requireUser } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';

import styles from '../area.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'area.files' });
  return { title: t('metaTitle') };
}

export default async function MaterialPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await resolveLocale(params);
  await requireUser({ locale, next: getPathname({ href: '/area-clientes/material', locale }) });
  const context = await getAreaContext();
  if (!context?.client) notFound();
  const t = await getTranslations({ locale, namespace: 'area.files' });
  const assets = await getAssets(context.client.id);
  const query = await searchParams;

  return (
    <>
      <header className={styles.head}>
        <TwoToneHeading level="h1" lead={t('title.lead')} tail={t('title.tail')} />
        <p className={styles.lede}>{t('lede')}</p>
      </header>
      {query.error === 'download' ? (
        <p className={styles.alert} role="alert">
          {t('downloadError')}
        </p>
      ) : null}
      <AreaGrid>
        <AreaCard id="files-list" title={t('listTitle')} span="full">
          <AssetList locale={locale} assets={assets} />
        </AreaCard>
        <AreaCard id="files-upload" title={t('upload.title')} span="full">
          <AssetUpload
            locale={locale}
            labels={{
              label: t('upload.label'),
              help: t('upload.help'),
              submit: t('upload.submit'),
              uploading: t('upload.uploading'),
              done: t('upload.done'),
              chooseFirst: t('upload.chooseFirst'),
              tooBig: t('upload.tooBig'),
              notAllowed: t('upload.notAllowed'),
              failed: t('upload.failed'),
              form: t('upload.title'),
            }}
          />
        </AreaCard>
      </AreaGrid>
    </>
  );
}
