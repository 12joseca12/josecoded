import { getTranslations } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHead } from '@/components/staff/page-head';
import { Button } from '@/components/ui/button';
import { CLIENTS_PATH, filterClients, hasClientFilters } from '@/lib/crm/clients';

import { ClientFilters } from './client-filters';
import { ClientTable } from './client-table';

import type { StaffRole } from '@/lib/auth/staff';
import type { ClientQuery, ClientRow } from '@/lib/crm/clients';
import type { Owner } from '@/lib/crm/contacts';
import type { Locale } from '@josecoded/types';

/**
 * K6, the clients of the portfolio, as a view of already-read data: the page fetches (`staff_clients()` returns a
 * closer her clients and the admin all of them) and the dev previews feed it fixtures. The owner column exists only for
 * the admin. The filters narrow what was read.
 */
export async function ClientsView({
  locale,
  role,
  rows,
  owners,
  query,
}: {
  locale: Locale;
  role: StaffRole;
  /** Every client the person may see. */
  rows: readonly ClientRow[];
  /** The staff, for the admin only. */
  owners: readonly Owner[] | null;
  query: ClientQuery;
}) {
  const t = await getTranslations({ locale, namespace: 'crmClients' });
  const admin = role === 'admin';
  const shown = filterClients(rows, query);
  const filtered = hasClientFilters(query);

  return (
    <>
      <PageHead title={t('title')} tone={t(admin ? 'tone.admin' : 'tone.closer')} lead={t('lead')} />
      <ClientFilters query={query} locale={locale} />
      {shown.length === 0 ? (
        <EmptyState
          live
          title={t(filtered && rows.length > 0 ? 'empty.filteredTitle' : 'empty.title')}
          text={t(filtered && rows.length > 0 ? 'empty.filteredText' : admin ? 'empty.textAdmin' : 'empty.textCloser')}
          action={
            filtered ? (
              <Button href={CLIENTS_PATH} variant="ghost" size="sm">
                {t('filters.clear')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ClientTable rows={shown} owners={admin ? owners : null} role={role} locale={locale} />
      )}
    </>
  );
}
