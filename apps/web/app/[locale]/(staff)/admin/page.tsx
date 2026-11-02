import { getTranslations } from 'next-intl/server';

import { PageHead } from '@/components/staff/page-head';
import { AdminSummary } from '@/components/staff/summary';
import { getAdminCounters, getOmenStatus } from '@/lib/admin/queries';
import { requireAdmin } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'crm' });
  return { title: t('adminMetaTitle') };
}

// C1. The page guards too: a layout does not re-run on client navigation.
export default async function AdminHomePage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  await requireAdmin({ locale, next: '/admin' });
  const [t, counters, omen] = await Promise.all([
    getTranslations({ locale, namespace: 'crm' }),
    getAdminCounters(),
    getOmenStatus(),
  ]);
  return (
    <>
      <PageHead title={t('summary.title')} tone={t('summary.titleTone.admin')} />
      <AdminSummary locale={locale} counters={counters} omen={omen} />
    </>
  );
}
