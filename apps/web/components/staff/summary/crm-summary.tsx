import { getFormatter, getTranslations } from 'next-intl/server';

import { OverdueList } from '@/components/crm/overdue-list';
import { StatusBadge } from '@/components/shared/status-badge';
import { Figure } from '@/components/staff/figure';
import { PageHead } from '@/components/staff/page-head';
import { StatList, StatRow } from '@/components/staff/stat-list';
import { SummaryCard } from '@/components/staff/summary-card';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { k1Figures } from '@/lib/crm/summary';

import { AdminSummary } from './admin-summary';
import styles from './summary.module.css';

import type { ContactRow } from '@/lib/crm/contacts';
import type { CrmSummary as Summary } from '@/lib/crm/queries';
import type { Locale } from '@josecoded/types';

/**
 * K1, the summary of `/crm` (PANT K1): what is due today, the leads, the commissions, the stories to decide, the
 * last import and the team in numbers. The admin sees the whole CRM and, as the last cell, the counters of C1.
 */
export async function CrmSummary({
  locale,
  summary,
  overdue = [],
}: {
  locale: Locale;
  summary: Summary;
  /** The oldest overdue contacts, for the short list under the figure. */
  overdue?: readonly ContactRow[];
}) {
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: 'crm' }), getFormatter({ locale })]);
  const f = k1Figures(summary);
  const mine = f.scope === 'mine';
  const euros = (amount: number) => format.number(amount, { style: 'currency', currency: 'EUR' });
  const last = f.importsLast;
  const today = format.dateTime(new Date(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' });

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
          <Figure tone={f.contactsDue > 0 ? 'overdue' : 'default'}>{format.number(f.contactsDue)}</Figure>
          <p className={styles.text}>{f.contactsDue > 0 ? t(`summary.due.${f.scope}`) : t('summary.due.none')}</p>
          <OverdueList rows={overdue} locale={locale} />
          <div className={styles.actions}>
            <Button
              href="/crm/contactos?due=1"
              icon="triangle-alert"
              variant={f.contactsDue > 0 ? 'solid' : 'ghost'}
            >
              {t('summary.due.cta')}
            </Button>
            <ArrowLink href="/crm/contactos">{t('summary.due.contacts')}</ArrowLink>
          </div>
        </SummaryCard>

        <SummaryCard icon="inbox" title={t(`summary.leads.${mine ? 'titleMine' : 'titleAll'}`)} cols={5}>
          <StatList>
            <StatRow label={t('summary.leads.open')} value={format.number(f.leadsOpen)} href="/crm/contactos" />
          </StatList>
        </SummaryCard>

        <SummaryCard
          icon="wallet"
          title={t(`summary.commissions.${mine ? 'titleMine' : 'titleAll'}`)}
          cols={5}
          aside={<ArrowLink href="/crm/comisiones">{t('summary.commissions.view')}</ArrowLink>}
        >
          <StatList>
            <StatRow label={t('summary.commissions.pending')} value={format.number(f.commissionsPending)} />
            <StatRow label={t('summary.commissions.approved')} value={euros(f.commissionsApprovedAmount)} />
          </StatList>
        </SummaryCard>

        <SummaryCard icon="list-checks" title={t('summary.stories.title')}>
          <Figure size="sm">{format.number(f.storiesProposed)}</Figure>
          <p className={styles.text}>
            {f.storiesProposed > 0 ? t(`summary.stories.${mine ? 'mine' : 'all'}`) : t('summary.stories.none')}
          </p>
          <ArrowLink href="/crm/clientes">{t('summary.stories.link')}</ArrowLink>
        </SummaryCard>

        <SummaryCard icon="upload" title={t('summary.import.title')}>
          {last ? (
            <>
              <p className={styles.result}>
                <span className={styles.when}>
                  <time dateTime={last.created_at}>
                    {format.dateTime(new Date(last.created_at), {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Europe/Madrid',
                    })}
                  </time>
                </span>
                <br />
                {t('summary.import.result', { created: last.created, updated: last.updated, skipped: last.skipped })}
              </p>
              {f.conflictsPending > 0 ? (
                <p>
                  <StatusBadge tone="attention">{t('summary.import.review', { count: f.conflictsPending })}</StatusBadge>
                </p>
              ) : null}
            </>
          ) : (
            <p className={styles.text}>{t('summary.import.none')}</p>
          )}
          <ArrowLink href="/crm/importar">{t(last ? 'summary.import.again' : 'summary.import.first')}</ArrowLink>
        </SummaryCard>

        <SummaryCard icon="users" title={t('summary.team.title')}>
          <StatList>
            <StatRow label={t('summary.team.wonMonth')} value={format.number(f.team.team_leads_won_month)} />
            <StatRow label={t('summary.team.open')} value={format.number(f.team.team_leads_open)} />
            <StatRow label={t('summary.team.contacts')} value={format.number(f.team.team_contacts)} />
          </StatList>
          <p className={styles.hint}>{t('summary.team.hint')}</p>
        </SummaryCard>

        {summary.role === 'admin' ? <AdminSummary locale={locale} /> : null}
      </div>
    </>
  );
}
