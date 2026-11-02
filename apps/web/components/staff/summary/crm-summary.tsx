import { getFormatter, getTranslations } from 'next-intl/server';

import { OverdueList } from '@/components/crm/overdue-list';
import { StatusBadge } from '@/components/shared/status-badge';
import { Figure } from '@/components/staff/figure';
import { PageHead } from '@/components/staff/page-head';
import { StatList, StatRow } from '@/components/staff/stat-list';
import { SummaryCard } from '@/components/staff/summary-card';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { contactsHref } from '@/lib/crm/contacts-url';
import { nearbyDay } from '@/lib/crm/next-action';
import { k1Figures } from '@/lib/crm/summary';
import { OPEN_LEAD_STATUSES } from '@/lib/crm/summary-extras';


import { AdminSummary } from './admin-summary';
import styles from './summary.module.css';

import type { OmenStatus as OmenState } from '@/lib/admin/queries';
import type { ContactRow } from '@/lib/crm/contacts';
import type { CrmSummary as Summary } from '@/lib/crm/queries';
import type { Money, SummaryExtras } from '@/lib/crm/summary-extras';
import type { Href, Locale } from '@josecoded/types';

/**
 * K1, the summary of `/crm` (PANT K1): what is due today, the leads, the commissions, the stories to decide, the
 * last import and the team in numbers. The admin sees the whole CRM and, as the last cell, the counters of C1.
 */
export async function CrmSummary({
  locale,
  summary,
  extras,
  overdue = [],
  omen = 'unconfigured',
  omenCheckedAt,
}: {
  locale: Locale;
  summary: Summary;
  /** What the counters do not carry: leads by status, commissions with amounts, the last import, the next story. */
  extras: SummaryExtras;
  /** The oldest overdue contacts, for the short list under the figure. */
  overdue?: readonly ContactRow[];
  /** State of Omen for the admin's closing cell (C1). */
  omen?: OmenState;
  /** When Omen was asked (the render itself, unless a cache says otherwise). */
  omenCheckedAt?: Date;
}) {
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: 'crm' }), getFormatter({ locale })]);
  const f = k1Figures(summary);
  const mine = f.scope === 'mine';
  // «248,00 € · 2»: the amount and how many it adds up
  const money = ({ amount, count }: Money) =>
    `${format.number(amount, { style: 'currency', currency: 'EUR' })} · ${format.number(count)}`;
  const last = extras.lastImport;
  const now = new Date();
  const importTime = last
    ? format.dateTime(new Date(last.at), {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Madrid',
      })
    : '';
  const importDay = last
    ? (nearbyDay(last.at, now, locale) ??
      format.dateTime(new Date(last.at), {
        day: 'numeric',
        month: 'short',
        timeZone: 'Europe/Madrid',
      }))
    : '';
  const importWhen = last ? t('summary.import.when', { day: importDay, time: importTime }) : '';
  const today = format.dateTime(new Date(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Madrid',
  });

  return (
    <>
      <PageHead
        title={t('summary.title')}
        tone={t(`summary.titleTone.${mine ? 'crm' : 'admin'}`)}
        lead={t(`summary.lead.${mine ? 'closer' : 'admin'}`, {
          // «lunes, 2 de noviembre» opens the sentence
          date: today.charAt(0).toLocaleUpperCase(locale) + today.slice(1),
          contacts: f.team.team_contacts,
        })}
      />
      <div className={`${styles.grid} ${styles.k1}`}>
        <SummaryCard icon="clock" title={t('summary.due.title')} tone="hero" cols={7} rows={2}>
          <Figure tone={f.contactsDue > 0 ? 'overdue' : 'default'}>
            {format.number(f.contactsDue)}
          </Figure>
          <p className={styles.text}>
            {f.contactsDue === 0
              ? t('summary.due.none')
              : f.scope === 'all' && f.unassignedDue > 0
                ? t('summary.due.allUnassigned', { unassigned: f.unassignedDue })
                : t(`summary.due.${f.scope}`)}
          </p>
          <OverdueList rows={overdue} locale={locale} />
          <div className={styles.actions}>
            <Button
              href="/crm/contactos?due=1"
              icon="triangle-alert"
              variant={f.contactsDue > 0 ? 'solid' : 'ghost'}
            >
              {t('summary.due.cta')}
            </Button>
            <ArrowLink size="label" href="/crm/contactos">{t('summary.due.contacts')}</ArrowLink>
          </div>
        </SummaryCard>

        <SummaryCard icon="inbox" title={t(`summary.leads.${mine ? 'titleMine' : 'titleAll'}`)} cols={5}>
          <StatList>
            {OPEN_LEAD_STATUSES.map((status) => (
              <StatRow
                key={status}
                label={t(`summary.leads.${status}`)}
                value={format.number(extras.leads[status])}
                href={contactsHref({}, { kind: 'lead', status }) as Href}
              />
            ))}
          </StatList>
        </SummaryCard>

        <SummaryCard
          icon="wallet"
          title={t(`summary.commissions.${mine ? 'titleMine' : 'titleAll'}`)}
          cols={5}
          aside={<ArrowLink size="sm" href="/crm/comisiones">{t('summary.commissions.view')}</ArrowLink>}
        >
          <StatList>
            <StatRow
              label={t('summary.commissions.pending')}
              value={money(extras.commissions.pending)}
            />
            <StatRow
              label={t('summary.commissions.approved')}
              value={money(extras.commissions.approved)}
            />
          </StatList>
        </SummaryCard>

        <SummaryCard icon="list-checks" title={t('summary.stories.title')}>
          <Figure size="sm">{format.number(f.storiesProposed)}</Figure>
          <p className={styles.text}>
            {f.storiesProposed > 0 ? t(`summary.stories.${mine ? 'mine' : 'all'}`) : t('summary.stories.none')}
          </p>
          {extras.nextStory ? (
            <ArrowLink size="label" href={`/crm/clientes/${extras.nextStory.clientId}`}>
              {t('summary.stories.linkNamed', { name: extras.nextStory.name })}
            </ArrowLink>
          ) : (
            <ArrowLink size="label" href="/crm/clientes">{t('summary.stories.link')}</ArrowLink>
          )}
        </SummaryCard>

        <SummaryCard icon="upload" title={t('summary.import.title')}>
          {last ? (
            <>
              <p className={styles.file}>
                <strong>{last.fileName ?? t('summary.import.unnamed')}</strong>
                <br />
                <span className={styles.when}>
                  {last.author
                    ? t('summary.import.byAuthor', { when: importWhen, author: last.author })
                    : importWhen}
                </span>
              </p>
              <p className={styles.result}>
                {t('summary.import.result', {
                  created: last.created,
                  updated: last.updated,
                  skipped: last.skipped,
                })}
                {f.conflictsPending > 0 ? (
                  <>
                    <span className={styles.sep} />
                    <StatusBadge tone="attention">
                      {t('summary.import.review', { count: f.conflictsPending })}
                    </StatusBadge>
                  </>
                ) : null}
              </p>
            </>
          ) : (
            <p className={styles.text}>{t('summary.import.none')}</p>
          )}
          <ArrowLink size="label" href="/crm/importar">{t(last ? 'summary.import.again' : 'summary.import.first')}</ArrowLink>
        </SummaryCard>

        <SummaryCard icon="users" title={t('summary.team.title')}>
          <StatList>
            <StatRow label={t('summary.team.wonMonth')} value={format.number(f.team.team_leads_won_month)} />
            <StatRow label={t('summary.team.open')} value={format.number(f.team.team_leads_open)} />
            <StatRow label={t('summary.team.contacts')} value={format.number(f.team.team_contacts)} />
          </StatList>
          <p className={styles.hint}>{t('summary.team.hint')}</p>
        </SummaryCard>

        {summary.role === 'admin' && summary.admin ? (
          <AdminSummary
            locale={locale}
            counters={summary.admin}
            omen={omen}
            omenCheckedAt={omenCheckedAt}
            omit={['contacts_due']}
          />
        ) : null}
      </div>
    </>
  );
}
