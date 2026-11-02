import { getTranslations } from 'next-intl/server';

import { CONTACT_KINDS } from '@josecoded/types';

import { ContactFilters } from '@/components/crm/contact-filters';
import { NewContactForm } from '@/components/crm/contact-forms';
import { ContactTable } from '@/components/crm/contact-table';
import { Pager } from '@/components/crm/pager';
import { SheetTrigger } from '@/components/crm/sheet';
import { getStatusOptions, getStatusSheetLabels, StatusSheetHost } from '@/components/crm/status-sheet';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHead } from '@/components/staff/page-head';
import { Button } from '@/components/ui/button';
import { requireStaff } from '@/lib/auth/staff';
import { getContactPage } from '@/lib/crm/contacts';
import { contactsHref, hasFilters } from '@/lib/crm/contacts-url';
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
  const [t, tKinds, page, statusOptions, statusLabels] = await Promise.all([
    getTranslations({ locale, namespace: 'crmContacts' }),
    getTranslations({ locale, namespace: 'crmContacts.kinds' }),
    getContactPage(role, raw),
    getStatusOptions(role, locale),
    getStatusSheetLabels(locale),
  ]);
  const isAdmin = role === 'admin';
  const filtered = hasFilters(page.query);

  const newLabels = {
    title: t('newContact.title'),
    kind: t('newContact.kind'),
    kindOptions: CONTACT_KINDS.map((kind) => ({ value: kind, label: tKinds(kind) })),
    name: t('newContact.name'),
    organization: t('newContact.organization'),
    email: t('newContact.email'),
    phone: t('newContact.phone'),
    linkedin: t('newContact.linkedin'),
    nextAction: t('newContact.nextAction'),
    nextActionHelp: t('newContact.nextActionHelp'),
    date: t('newContact.date'),
    time: t('newContact.time'),
    owner: t('newContact.owner'),
    ownerHelp: t('newContact.ownerHelp'),
    ownerOptions: page.owners
      ? [
          { value: '', label: t('newContact.ownerNone') },
          ...page.owners.filter((owner) => !owner.disabled).map((owner) => ({ value: owner.user_id, label: owner.display_name })),
        ]
      : null,
    submit: t('newContact.submit'),
    cancel: t('newContact.cancel'),
    locale,
  };

  return (
    <>
      <PageHead
        title={t('inbox.title')}
        tone={t(`inbox.tone.${isAdmin ? 'admin' : 'closer'}`)}
        lead={t('inbox.lead')}
        actions={
          <>
            <Button href="/crm/importar" variant="ghost" icon="upload">
              {t('inbox.import')}
            </Button>
            <SheetTrigger
              label={t('inbox.new')}
              icon="plus"
              variant="ghost"
              defaultOpen={raw.nuevo === '1'}
              title={t('newContact.title')}
              closeLabel={t('newContact.close')}
              savedMessage={t('newContact.saved')}
            >
              <NewContactForm labels={newLabels} />
            </SheetTrigger>
          </>
        }
      />
      <ContactFilters query={page.query} owners={page.owners} locale={locale} />
      {page.rows.length === 0 ? (
        <EmptyState
          live
          title={t(filtered ? 'inbox.emptyFiltered.title' : 'inbox.empty.title')}
          text={t(filtered ? 'inbox.emptyFiltered.text' : 'inbox.empty.text')}
          action={
            filtered ? (
              <Button href="/crm/contactos" variant="ghost" size="sm">
                {t('filters.clear')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <StatusSheetHost options={statusOptions} labels={statusLabels}>
            <ContactTable rows={page.rows} owners={page.owners} locale={locale} />
          </StatusSheetHost>
          <Pager
            page={page.page}
            pageSize={page.pageSize}
            total={page.total}
            locale={locale}
            hrefFor={(n) => contactsHref(page.query, { page: n }) as `/${string}`}
          />
        </>
      )}
    </>
  );
}
