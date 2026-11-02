import { getTranslations } from 'next-intl/server';

import { CrmSummary } from '@/components/staff/summary';
import { getOmenStatus } from '@/lib/admin/queries';
import { requireStaff } from '@/lib/auth/staff';
import { getOverdueContacts } from '@/lib/crm/contacts';
import { getCrmSummary } from '@/lib/crm/queries';
import { getSummaryExtras } from '@/lib/crm/summary-extras';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'crm' });
  return { title: t('metaTitle') };
}

/** The short list under the figure of K1 shows the three oldest. */
const OVERDUE_SHOWN = 3;

// K1. The page guards too: a layout does not re-run on client navigation.
export default async function CrmHomePage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const { role } = await requireStaff({ locale, next: '/crm' });
  const summary = await getCrmSummary(role);
  // the list is a detail of the figure: without overdue contacts there is nothing to ask for
  const dueNow = role === 'admin' ? (summary.admin?.contacts_due ?? 0) : summary.my.contacts_due;
  const [overdue, omen, extras] = await Promise.all([
    dueNow > 0 ? getOverdueContacts(role, OVERDUE_SHOWN) : Promise.resolve([]),
    role === 'admin' ? getOmenStatus() : Promise.resolve(undefined),
    getSummaryExtras(role),
  ]);
  return (
    <CrmSummary locale={locale} summary={summary} extras={extras} overdue={overdue} omen={omen} />
  );
}
