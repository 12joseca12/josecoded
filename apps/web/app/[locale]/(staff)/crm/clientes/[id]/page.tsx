import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { ClientDetailView } from '@/components/crm/clients';
import { requireStaff } from '@/lib/auth/staff';
import { getClientFile } from '@/lib/crm/client-queries';
import { resolveLocale } from '@/lib/locale';

import type { Metadata } from 'next';

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'crmClients' });
  return { title: t('metaTitleFile') };
}

/**
 * K6, the file of one client. A closer asking for a client that is not in her portfolio gets the same 404 as for an
 * id that does not exist: `staff_clients(id)` returns her no row, and the page cannot tell the two apart. The page
 * only reads.
 */
export default async function ClientPage({ params }: { params: Params }) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  if (!z.uuid().safeParse(id).success) notFound();
  const { role, supabase } = await requireStaff({ locale, next: `/crm/clientes/${id}` });

  const file = await getClientFile(supabase, role, id);
  if (!file) notFound();

  return <ClientDetailView locale={locale} role={role} file={file} />;
}
