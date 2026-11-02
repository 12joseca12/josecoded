import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { ContactHead, ClientCard, ContactLayout, DataCard, DraftList, OpportunityCard, ReachLinks, StoryList } from '@/components/crm/contact-detail';
import { NoteForm } from '@/components/crm/contact-forms';
import { InteractionTimeline } from '@/components/crm/interaction-timeline';
import { NextActionBanner } from '@/components/crm/next-action-banner';
import { getStatusOptions, getStatusSheetLabels } from '@/components/crm/status-sheet';
import { TabNav } from '@/components/crm/tab-nav';
import { requireStaff } from '@/lib/auth/staff';
import { getContactDetail, getPackChoices } from '@/lib/crm/contact-detail';
import { resolveLocale } from '@/lib/locale';

import type { Metadata } from 'next';

type Params = Promise<{ locale: string; id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = { title: 'CRM' };

const TABS = ['historial', 'mensajes', 'historias'] as const;

/**
 * K3, one contact. A closer asking for a contact that is not in her portfolio gets the same 404 as for an id that
 * does not exist: RLS gives her no row, and the page cannot tell the two apart. Everything the page renders for the
 * admin only (owner, reassigning, closing as paid, Notion) is also refused by the database and by the action.
 */
export default async function ContactPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const raw = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const { role } = await requireStaff({ locale, next: `/crm/contactos/${id}` });

  const detail = await getContactDetail(id, role);
  if (!detail) notFound();
  const { contact, interactions, leads, client, stories, drafts, owners } = detail;
  const isAdmin = role === 'admin';

  const [t, statusOptions, statusLabels, packs] = await Promise.all([
    getTranslations({ locale, namespace: 'crmContacts' }),
    getStatusOptions(role, locale),
    getStatusSheetLabels(locale),
    isAdmin && leads.some((lead) => lead.status === 'open' && !lead.pack_code) && !client ? getPackChoices() : Promise.resolve([]),
  ]);

  const requested = Array.isArray(raw.tab) ? raw.tab[0] : raw.tab;
  const tabs = TABS.filter((tab) => tab !== 'historias' || client);
  const tab = tabs.find((candidate) => candidate === requested) ?? 'historial';
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
      />
      <ContactLayout
        sideLabel={t('detail.side')}
        main={
          <>
            <ReachLinks contact={contact} isAdmin={isAdmin} locale={locale} />
            <NextActionBanner contactId={contact.id} text={contact.next_action} at={contact.next_action_at} locale={locale} />
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
                  <NoteForm contactId={contact.id} labels={{ label: t('detail.note.label'), submit: t('detail.note.submit'), saved: t('detail.note.saved'), locale }} />
                  <h2 className="sr-only">{t('detail.tabs.historial')}</h2>
                  <InteractionTimeline items={interactions} locale={locale} />
                </>
              ) : null}
              {tab === 'mensajes' ? <DraftList drafts={drafts} locale={locale} /> : null}
              {tab === 'historias' && client ? <StoryList stories={stories} clientId={client.id} locale={locale} /> : null}
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
              packs={packs}
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
