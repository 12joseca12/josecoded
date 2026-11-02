import { getTranslations } from 'next-intl/server';

import { ContactsView } from '@/components/crm/contacts-view';
import { getStatusOptions, getStatusSheetLabels } from '@/components/crm/status-sheet';
import { requireStaff } from '@/lib/auth/staff';
import { getContactPage } from '@/lib/crm/contacts';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'crmContacts' });
  return { title: t('metaTitle') };
}

/**
 * K2, the inbox of contacts. There is no owner filter in the code that protects data: the database returns the
 * portfolio of a closer or everything to the admin, and the owner filter and column exist only for the admin. The
 * overdue ones come first. `?due=1` (the link of K1), `?kind`, `?status`, `?q`, `?owner` and `?page` live in the URL;
 * `?nuevo=1` opens the sheet of a new contact.
 */
export default async function ContactsPage({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const locale = await resolveLocale(params);
  const raw = await searchParams;
  const { role } = await requireStaff({ locale, next: '/crm/contactos' });
  const [page, statusOptions, statusLabels] = await Promise.all([
    getContactPage(role, raw),
    getStatusOptions(role, locale),
    getStatusSheetLabels(locale),
  ]);
  return <ContactsView locale={locale} role={role} page={page} statusOptions={statusOptions} statusLabels={statusLabels} openNew={raw.nuevo === '1'} />;
}
