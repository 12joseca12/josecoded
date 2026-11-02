import { getTranslations } from 'next-intl/server';

import { ClientsView } from '@/components/crm/clients';
import { requireStaff } from '@/lib/auth/staff';
import { getClientList } from '@/lib/crm/client-queries';
import { parseClientQuery } from '@/lib/crm/clients';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'crmClients' });
  return { title: t('metaTitle') };
}

/**
 * K6, the clients of the portfolio, for closers and the admin. The page only reads: `staff_clients()` returns a
 * closer the clients of her own contacts and the admin all of them (the database decides, not this page), and the
 * filters of the URL narrow what was read.
 */
export default async function ClientsPage({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const locale = await resolveLocale(params);
  const query = parseClientQuery(await searchParams);
  const { role, supabase } = await requireStaff({ locale, next: '/crm/clientes' });
  const { rows, owners } = await getClientList(supabase, role);

  return <ClientsView locale={locale} role={role} rows={rows} owners={owners} query={query} />;
}
