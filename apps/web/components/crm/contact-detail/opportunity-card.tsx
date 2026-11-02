import { getFormatter, getTranslations } from 'next-intl/server';

import { StatusBadge } from '@/components/shared/status-badge';
import { toInputParts } from '@/lib/crm/next-action';

import { CloseLeadForm, RequestCloseForm } from '../contact-forms';
import { DetailCard } from '../detail-card';
import { SheetTrigger } from '../sheet';
import { StatusForm } from '../status-sheet';
import styles from './contact-detail.module.css';

import type { StatusOption, StatusSheetLabels } from '../status-sheet';
import type { StaffRole } from '@/lib/auth/staff';
import type { ContactRecord, LeadRecord, PackChoice } from '@/lib/crm/contact-detail';
import type { Owner } from '@/lib/crm/contacts';
import type { Locale } from '@josecoded/types';

/**
 * The opportunities (leads) of the contact. An open one carries the actions that belong to the role: the admin
 * closes it as paid («Cerrar cobrado», ghost: the violet action of the view is «Redactar mensaje»); a closer
 * marks the proposal as sent or asks Jose to close it. The closer never sees the admin's button, and its action
 * refuses her anyway.
 */
export async function OpportunityCard({
  contact,
  leads,
  role,
  hasClient,
  owner,
  packs,
  statusOptions,
  statusLabels,
  locale,
}: {
  contact: ContactRecord;
  leads: readonly LeadRecord[];
  role: StaffRole;
  hasClient: boolean;
  /** The closer who owns the contact (admin's view only). */
  owner: Owner | null;
  /** Packs on sale, to give a manual lead its pack at closing (admin only). */
  packs: readonly PackChoice[];
  statusOptions: readonly StatusOption[];
  statusLabels: StatusSheetLabels;
  locale: Locale;
}) {
  const [t, tSource, format] = await Promise.all([
    getTranslations({ locale, namespace: 'crmContacts.opportunity' }),
    getTranslations({ locale, namespace: 'crmContacts.sources' }),
    getFormatter({ locale }),
  ]);
  if (leads.length === 0) return null;
  const today = toInputParts(new Date().toISOString())?.date ?? '';
  const parts = toInputParts(contact.next_action_at);
  const statusContact = {
    id: contact.id,
    name: contact.display_name,
    organization: contact.organization?.name ?? null,
    kind: contact.kind,
    status: contact.status,
    nextAction: contact.next_action,
    date: parts?.date ?? null,
    time: parts?.time ?? null,
  };

  return (
    <DetailCard icon="receipt" title={t('title', { count: leads.length })}>
      {leads.map((lead) => {
        const open = lead.status === 'open';
        const needsPack = open && !lead.pack_code && !hasClient;
        return (
          <div key={lead.id} className={styles.lead}>
            <p className={styles.small}>
              <StatusBadge tone={open ? 'active' : lead.status === 'won' ? 'live' : 'muted'}>{t(`status.${lead.status}`)}</StatusBadge>{' '}
              <strong>{lead.pack_code ? `${lead.pack_code}${lead.pack_option ? ` · ${lead.pack_option}` : ''}` : t('noPack')}</strong>
            </p>
            <p className={`${styles.small} ${styles.muted}`}>
              {[
                tSource.has(lead.source) ? tSource(lead.source) : lead.source,
                format.dateTime(new Date(lead.created_at), { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }),
                lead.amount !== null ? format.number(Number(lead.amount), { style: 'currency', currency: 'EUR' }) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {lead.message ? <p className={`${styles.small} ${styles.muted}`}>{lead.message}</p> : null}
            {open && role === 'admin' ? (
              <div className={styles.actions}>
                <SheetTrigger
                  label={t('closePaid')}
                  icon="circle-check"
                  title={t('closeTitle')}
                  description={t('closeHelp')}
                  sheetVariant="dialog"
                  closeLabel={t('close')}
                  savedMessage={t('closed')}
                >
                  <CloseLeadForm
                    leadId={lead.id}
                    contactId={contact.id}
                    today={today}
                    labels={{
                      title: t('closeTitle'),
                      amount: t('amount'),
                      amountHelp: t('amountHelp'),
                      paidAt: t('paidAt'),
                      pack: needsPack ? t('pack') : null,
                      packOptions: packs.map((pack) => ({ value: pack.code, label: pack.label })),
                      commission: owner
                        ? {
                            legend: t('commission.legend', { name: owner.display_name }),
                            auto: t('commission.auto', { name: owner.display_name }),
                            yes: t('commission.yes', { name: owner.display_name, rate: owner.rate }),
                            no: t('commission.no'),
                          }
                        : null,
                      defaultCommission: 'auto',
                      submit: t('closeSubmit'),
                      cancel: t('cancel'),
                      locale,
                    }}
                  />
                </SheetTrigger>
              </div>
            ) : null}
            {open && role === 'closer' ? (
              <div className={styles.actions}>
                {contact.status !== 'proposal_sent' && statusOptions.some((option) => option.value === 'proposal_sent') ? (
                  <SheetTrigger
                    label={t('markSent')}
                    size="sm"
                    title={statusLabels.title}
                    description={contact.display_name}
                    closeLabel={t('close')}
                    savedMessage={statusLabels.saved}
                  >
                    <StatusForm contact={statusContact} options={statusOptions} labels={statusLabels} suggestedStatus="proposal_sent" />
                  </SheetTrigger>
                ) : null}
                <SheetTrigger
                  label={t('requestClose')}
                  size="sm"
                  title={t('requestTitle')}
                  description={t('requestHelp')}
                  sheetVariant="dialog"
                  closeLabel={t('close')}
                  savedMessage={t('requested')}
                >
                  <RequestCloseForm
                    leadId={lead.id}
                    contactId={contact.id}
                    labels={{ title: t('requestTitle'), submit: t('requestSubmit'), cancel: t('cancel'), locale }}
                  />
                </SheetTrigger>
              </div>
            ) : null}
          </div>
        );
      })}
    </DetailCard>
  );
}
