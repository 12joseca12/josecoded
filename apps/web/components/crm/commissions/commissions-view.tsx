import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHead } from '@/components/staff/page-head';
import { Button } from '@/components/ui/button';
import {
  closersOf,
  commissionsHref,
  filterCommissions,
  totalsByStatus,
} from '@/lib/crm/commissions';

import { CloserFilter } from './closer-filter';
import { CommissionActionHost } from './commission-actions';
import { CommissionTable } from './commission-table';
import { CommissionTotals } from './commission-totals';

import type { StaffRole } from '@/lib/auth/staff';
import type { CommissionQuery, CommissionRecord } from '@/lib/crm/commissions';
import type { Locale } from '@josecoded/types';

/**
 * K5, the commissions, as a view of already-read data: the page fetches (the database returns a closer her own rows
 * and the admin all of them) and the dev previews feed it fixtures. The closer filter, the «Closer» column and the
 * approve / reject / pay buttons exist only for the admin; the page that gives him the actions already passed
 * `requireAdmin()` in each Server Action. The totals count every status of the closers in view; the list adds the
 * status of the query. Only the sentences of the dialogs travel to the browser.
 */
export async function CommissionsView({
  locale,
  role,
  rows,
  query,
}: {
  locale: Locale;
  role: StaffRole;
  /** Every commission the person may see. */
  rows: readonly CommissionRecord[];
  query: CommissionQuery;
}) {
  const [t, tFilters, messages] = await Promise.all([
    getTranslations({ locale, namespace: 'crmCommissions' }),
    getTranslations({ locale, namespace: 'crmCommissions.filters' }),
    getMessages(),
  ]);
  const admin = role === 'admin';
  const closers = admin ? closersOf(rows) : [];
  // a closer never filters by closer: her rows are already only hers, and a stray `?closer=` means nothing to her
  const effective: CommissionQuery = { status: query.status, closer: admin ? query.closer : null };
  const scoped = filterCommissions(rows, { status: null, closer: effective.closer });
  const shown = filterCommissions(rows, effective);

  return (
    <>
      <PageHead title={t('title')} tone={t('tone')} lead={t(admin ? 'lead.admin' : 'lead.closer')} />
      {admin ? (
        <CloserFilter
          query={effective}
          options={[
            { value: '', label: tFilters('closerAll') },
            ...closers.map((closer) => ({
              value: closer.id,
              label: closer.disabled ? `${closer.name} ${tFilters('closerOff')}` : closer.name,
            })),
          ]}
          labels={{
            region: tFilters('label'),
            closer: tFilters('closer'),
            apply: tFilters('apply'),
            hint: tFilters('hint'),
          }}
        />
      ) : null}
      <CommissionTotals totals={totalsByStatus(scoped)} query={effective} locale={locale} />
      {shown.length === 0 ? (
        <EmptyState
          live
          title={t(rows.length === 0 ? 'empty.title' : 'empty.filteredTitle')}
          text={t(rows.length === 0 ? (admin ? 'empty.textAdmin' : 'empty.text') : 'empty.filteredText')}
          action={
            rows.length > 0 ? (
              <Button href={commissionsHref({ status: null, closer: null }) as `/${string}`} variant="ghost" size="sm">
                {tFilters('clear')}
              </Button>
            ) : undefined
          }
        />
      ) : admin ? (
        <NextIntlClientProvider messages={{ crmCommissions: { dialogs: messages.crmCommissions.dialogs } }}>
          <CommissionActionHost locale={locale}>
            <CommissionTable rows={shown} locale={locale} admin />
          </CommissionActionHost>
        </NextIntlClientProvider>
      ) : (
        <CommissionTable rows={shown} locale={locale} admin={false} />
      )}
    </>
  );
}
