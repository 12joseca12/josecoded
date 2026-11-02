import { getTranslations } from 'next-intl/server';

import { CrmSummary } from '@/components/staff/summary';
import { requireStaff } from '@/lib/auth/staff';
import { getCrmSummary } from '@/lib/crm/queries';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'crm' });
  return { title: t('metaTitle') };
}

// K1. The page guards too: a layout does not re-run on client navigation.
export default async function CrmHomePage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const { role } = await requireStaff({ locale, next: '/crm' });
  const summary = await getCrmSummary(role);
  return <CrmSummary locale={locale} summary={summary} />;
}
