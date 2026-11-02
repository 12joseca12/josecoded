import { getTranslations } from 'next-intl/server';

import { NoteForm } from '@/components/crm/contact-forms';
import { InteractionTimeline } from '@/components/crm/interaction-timeline';
import { NextActionBanner } from '@/components/crm/next-action-banner';
import { TabNav } from '@/components/crm/tab-nav';

import { ClientCard } from './client-card';
import styles from './contact-detail.module.css';
import { ContactHead } from './contact-head';
import { ContactLayout } from './contact-layout';
import { DataCard } from './data-card';
import { DraftList } from './draft-list';
import { OpportunityCard } from './opportunity-card';
import { QuoteList } from './quote-list';
import { ReachLinks } from './reach-links';
import { StoryList } from './story-list';

import type { StatusOptions, StatusSheetLabels } from '@/components/crm/status-sheet';
import type { StaffRole } from '@/lib/auth/staff';
import type { ContactDetail, PackChoice } from '@/lib/crm/contact-detail';
import type { Locale } from '@josecoded/types';

const TABS = ['historial', 'mensajes', 'historias', 'presupuestos'] as const;

export interface ContactDetailViewProps {
  locale: Locale;
  role: StaffRole;
  detail: ContactDetail;
  /** `?tab=`, as the URL carries it: an unknown or unavailable tab falls back to the history. */
  requestedTab?: string;
  statusOptions: StatusOptions;
  statusLabels: StatusSheetLabels;
  /** Packs the admin can give a manual lead before closing it. */
  packs?: readonly PackChoice[];
}

/**
 * K3, one contact, as a view of already-read data: the page fetches and guards (a closer asking for a contact that
 * is not hers gets a 404 there) and the dev previews feed it fixtures. Everything for the admin alone (owner,
 * reassigning, closing as paid, Notion) is also refused by the database and by the action.
 */
export async function ContactDetailView({ locale, role, detail, requestedTab, statusOptions, statusLabels, packs = [] }: ContactDetailViewProps) {
  const { contact, interactions, leads, client, stories, drafts, owners } = detail;
  const isAdmin = role === 'admin';
  const t = await getTranslations({ locale, namespace: 'crmContacts' });

    const tabs = TABS.filter((tab) => tab !== 'historias' || client);
  const tab = tabs.find((candidate) => candidate === requestedTab) ?? 'historial';
  const base = `/crm/contactos/${contact.id}`;
  const owner = owners?.find((candidate) => candidate.user_id === contact.owner_id && candidate.role === 'closer') ?? null;

  return (
    <>
      <ContactHead
        contact={contact}
        owners={owners}
        statusOptions={statusOptions[contact.kind]}
        statusLabels={statusLabels}
        locale={locale}
      >
        <ReachLinks contact={contact} isAdmin={isAdmin} locale={locale} />
        <NextActionBanner
          contactId={contact.id}
          text={contact.next_action}
          at={contact.next_action_at}
          locale={locale}
        />
      </ContactHead>
      <ContactLayout
        sideLabel={t('detail.side')}
        main={
          <>
            <div>
              <TabNav
                label={t('detail.tabs.label')}
                current={tab}
                items={tabs.map((id) => ({
                  id,
                  label: t(`detail.tabs.${id}`),
                  href: `${base}${id === 'historial' ? '' : `?tab=${id}`}` as `/${string}`,
                  count: id === 'historias' ? stories.filter((story) => story.status === 'proposed').length : id === 'mensajes' ? drafts.length : undefined,
                }))}
              />
              {tab === 'historial' ? (
                <>
                  <div className={styles.composer}>
                  <NoteForm
                    contactId={contact.id}
                    labels={{
                      label: t('detail.note.label'),
                      placeholder: t('detail.note.placeholder'),
                      submit: t('detail.note.submit'),
                      saved: t('detail.note.saved'),
                      locale,
                    }}
                  />
                  </div>
                  <h2 className="sr-only">{t('detail.tabs.historial')}</h2>
                  <InteractionTimeline items={interactions} locale={locale} />
                </>
              ) : null}
              {tab === 'mensajes' ? <DraftList drafts={drafts} locale={locale} /> : null}
              {tab === 'historias' && client ? (
                <StoryList stories={stories} clientId={client.id} locale={locale} />
              ) : null}
              {tab === 'presupuestos' ? <QuoteList locale={locale} /> : null}
            </div>
          </>
        }
        side={
          <>
            <OpportunityCard
              contact={contact}
              leads={leads}
              role={role}
              hasClient={client !== null}
              owner={owner}
              packs={[...packs]}
              statusOptions={statusOptions[contact.kind]}
              statusLabels={statusLabels}
              locale={locale}
            />
            {client ? <ClientCard client={client} contact={contact} interactions={interactions} role={role} locale={locale} /> : null}
            <DataCard contact={contact} locale={locale} />
          </>
        }
      />
    </>
  );
}
