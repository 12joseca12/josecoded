import { getTranslations } from 'next-intl/server';

import { CONTACT_KINDS } from '@josecoded/types';

import { ContactFilters } from '@/components/crm/contact-filters';
import { NewContactForm } from '@/components/crm/contact-forms';
import { ContactTable } from '@/components/crm/contact-table';
import { Pager } from '@/components/crm/pager';
import { SheetTrigger } from '@/components/crm/sheet';
import { StatusSheetHost } from '@/components/crm/status-sheet';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHead } from '@/components/staff/page-head';
import { Button } from '@/components/ui/button';
import { contactsHref, hasFilters } from '@/lib/crm/contacts-url';

import type { StatusOptions, StatusSheetLabels } from '@/components/crm/status-sheet';
import type { StaffRole } from '@/lib/auth/staff';
import type { ContactPage } from '@/lib/crm/contacts';
import type { Locale } from '@josecoded/types';

export interface ContactsViewProps {
  locale: Locale;
  role: StaffRole;
  page: ContactPage;
  statusOptions: StatusOptions;
  statusLabels: StatusSheetLabels;
  /** `?nuevo=1`: the sheet of a new contact starts open. */
  openNew?: boolean;
  /** Overdue contacts of the person, for the «Solo vencidas» toggle. */
  overdue?: number | null;
}

/**
 * K2, the inbox of contacts, as a view of already-read data: the page fetches (RLS decides what exists for the
 * person) and the dev previews feed it fixtures. The owner filter and column exist only for the admin.
 */
export async function ContactsView({
  locale,
  role,
  page,
  statusOptions,
  statusLabels,
  openNew = false,
  overdue = null,
}: ContactsViewProps) {
  const [t, tKinds] = await Promise.all([
    getTranslations({ locale, namespace: 'crmContacts' }),
    getTranslations({ locale, namespace: 'crmContacts.kinds' }),
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
              variant="quiet"
              size="sm"
              defaultOpen={openNew}
              title={t('newContact.title')}
              closeLabel={t('newContact.close')}
              savedMessage={t('newContact.saved')}
            >
              <NewContactForm labels={newLabels} />
            </SheetTrigger>
          </>
        }
      />
      <ContactFilters query={page.query} owners={page.owners} overdue={overdue} locale={locale} />
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
