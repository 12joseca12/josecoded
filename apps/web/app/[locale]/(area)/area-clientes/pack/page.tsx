import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { PackSummary } from '@/components/area/pack-summary';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import { getPathname } from '@/i18n/navigation';
import { getAreaContext, getClientExtras, getUpgradeRequests } from '@/lib/area/queries';
import { requireUser } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';

import styles from '../area.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'area.plan' });
  return { title: t('metaTitle') };
}

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await resolveLocale(params);
  await requireUser({ locale, next: getPathname({ href: '/area-clientes/pack', locale }) });
  const context = await getAreaContext();
  if (!context?.client) notFound();
  const t = await getTranslations({ locale, namespace: 'area.plan' });
  const [extras, requests] = await Promise.all([
    getClientExtras(context.client.id),
    getUpgradeRequests(context.client.id),
  ]);
  const query = await searchParams;

  return (
    <>
      <header className={styles.head}>
        <TwoToneHeading level="h1" lead={t('title.lead')} tail={t('title.tail')} />
        <p className={styles.lede}>{t('lede')}</p>
      </header>
      <PackSummary
        locale={locale}
        client={context.client}
        extras={extras}
        requests={requests}
        justRequested={query.requested === '1'}
      />
    </>
  );
}
