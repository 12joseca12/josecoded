import { getTranslations } from 'next-intl/server';

import { CommissionsView } from '@/components/crm/commissions';
import { requireStaff } from '@/lib/auth/staff';
import { getCommissions } from '@/lib/crm/commission-queries';
import { parseCommissionQuery } from '@/lib/crm/commissions';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'crmCommissions' });
  return { title: t('metaTitle') };
}

/**
 * K5, commissions, for closers and the admin. The page only reads: `staff_commissions()` returns a closer her own
 * rows and the admin all of them (the database decides, not this page), and the approve / reject / pay buttons are
 * drawn for the admin only and guarded again, by `requireAdmin()`, in each Server Action.
 */
export default async function CommissionsPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  const locale = await resolveLocale(params);
  const query = parseCommissionQuery(await searchParams);
  const { role, supabase } = await requireStaff({ locale, next: '/crm/comisiones' });
  const rows = await getCommissions(supabase);

  return <CommissionsView locale={locale} role={role} rows={rows} query={query} />;
}
