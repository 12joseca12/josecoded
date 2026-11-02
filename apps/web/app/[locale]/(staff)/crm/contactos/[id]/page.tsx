import { notFound } from 'next/navigation';
import { z } from 'zod';

import { ContactDetailView } from '@/components/crm/contact-detail';
import { getStatusOptions, getStatusSheetLabels } from '@/components/crm/status-sheet';
import { requireStaff } from '@/lib/auth/staff';
import { getContactDetail, getPackChoices } from '@/lib/crm/contact-detail';
import { resolveLocale } from '@/lib/locale';

import type { Metadata } from 'next';

type Params = Promise<{ locale: string; id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = { title: 'CRM' };

/**
 * K3, one contact. A closer asking for a contact that is not in her portfolio gets the same 404 as for an id that
 * does not exist: RLS gives her no row, and the page cannot tell the two apart.
 */
export default async function ContactPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const raw = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const { role } = await requireStaff({ locale, next: `/crm/contactos/${id}` });

  const detail = await getContactDetail(id, role);
  if (!detail) notFound();
  const { leads, client } = detail;

  const [statusOptions, statusLabels, packs] = await Promise.all([
    getStatusOptions(role, locale),
    getStatusSheetLabels(locale),
    role === 'admin' && leads.some((lead) => lead.status === 'open' && !lead.pack_code) && !client ? getPackChoices() : Promise.resolve([]),
  ]);
  const requested = Array.isArray(raw.tab) ? raw.tab[0] : raw.tab;

  return (
    <ContactDetailView locale={locale} role={role} detail={detail} requestedTab={requested} statusOptions={statusOptions} statusLabels={statusLabels} packs={packs} />
  );
}
