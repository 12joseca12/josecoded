import { getTranslations } from 'next-intl/server';

import { ClientDetailView, ClientsView } from '@/components/crm/clients';
import { CommissionsView } from '@/components/crm/commissions';
import { ContactDetailView } from '@/components/crm/contact-detail';
import { ContactsView } from '@/components/crm/contacts-view';
import { ImportView } from '@/components/crm/import';
import { getStatusOptions, getStatusSheetLabels } from '@/components/crm/status-sheet';
import { PageHead } from '@/components/staff/page-head';
import { StaffShell } from '@/components/staff/staff-shell';
import { AdminSummary, CrmSummary } from '@/components/staff/summary';
import { parseClientQuery } from '@/lib/crm/clients';
import { parseCommissionQuery } from '@/lib/crm/commissions';
import {
  ADMIN_COUNTERS,
  PREVIEW_IDENTITY,
  PREVIEW_OMEN,
  IMPORT_PREVIEW_FILE,
  previewClientFile,
  previewClientList,
  previewConflictQueue,
  previewCommissions,
  previewContactDetail,
  previewContactPage,
  previewExtras,
  previewImportAnalysis,
  previewImportHistory,
  previewImportResult,
  previewImportText,
  previewOmenCheckedAt,
  previewOverdue,
  previewOwnConflicts,
  previewSummary,
} from '@/lib/dev/crm-fixtures';


import type { StaffRole } from '@/lib/auth/staff';
import type { PreviewScreen } from '@/lib/dev/crm-previews';
import type { Locale } from '@josecoded/types';

/** The logical path each preview stands for, so the rail marks its destination as it would on the real page. */
const CURRENT_PATH: Record<PreviewScreen, string> = {
  resumen: '/crm',
  contactos: '/crm/contactos',
  'contacto-lead': '/crm/contactos/preview',
  'contacto-cliente': '/crm/contactos/preview',
  'importar-archivo': '/crm/importar',
  'importar-columnas': '/crm/importar',
  'importar-resultado': '/crm/importar',
  conflictos: '/crm/importar',
  comisiones: '/crm/comisiones',
  clientes: '/crm/clientes',
  cliente: '/crm/clientes/preview',
  admin: '/admin',
};

/**
 * One screen of /crm or /admin with fixtures instead of Supabase, inside the real `StaffShell`. It composes the same
 * views the real pages compose (`CrmSummary`, `ContactsView`, `ContactDetailView`, `AdminSummary`); only the reads
 * are replaced. Gated by `requireDevUi()` in the route.
 */
export async function CrmPreview({
  locale,
  screen,
  role,
  tab,
  search = {},
}: {
  locale: Locale;
  screen: PreviewScreen;
  role: StaffRole;
  tab?: string;
  /** The query of the URL: `?status` and `?closer` of K5, `?q`, `?access` and `?stories` of K6 (`?client=vacio` on the file: the client without access, tasks or stories). */
  search?: Record<string, string | string[] | undefined>;
}) {
  const summary = previewSummary(role);
  const overdue = (role === 'admin' ? summary.admin?.contacts_due : summary.my.contacts_due) ?? 0;
  const [statusOptions, statusLabels] = await Promise.all([
    getStatusOptions(role, locale),
    getStatusSheetLabels(locale),
  ]);

  return (
    <StaffShell
      locale={locale}
      zone={screen === 'admin' ? 'admin' : 'crm'}
      role={role}
      identity={PREVIEW_IDENTITY[role]}
      overdue={overdue}
      currentPath={CURRENT_PATH[screen]}
    >
      {await screenOf()}
    </StaffShell>
  );

  async function screenOf() {
    switch (screen) {
      case 'resumen':
        return (
          <CrmSummary
            locale={locale}
            summary={summary}
            extras={previewExtras(role)}
            overdue={previewOverdue(role).slice(0, 3)}
            omen={PREVIEW_OMEN}
            omenCheckedAt={previewOmenCheckedAt()}
          />
        );
      case 'contactos':
        return (
          <ContactsView
            locale={locale}
            role={role}
            page={previewContactPage(role)}
            statusOptions={statusOptions}
            statusLabels={statusLabels}
            overdue={overdue}
          />
        );
      case 'contacto-lead':
      case 'contacto-cliente':
        return (
          <ContactDetailView
            locale={locale}
            role={role}
            detail={previewContactDetail(screen === 'contacto-lead' ? 'lead' : 'client', role)}
            requestedTab={tab}
            statusOptions={statusOptions}
            statusLabels={statusLabels}
            packs={[{ code: 'P2', label: 'P2 · Tienda online' }]}
          />
        );
      case 'importar-archivo':
      case 'importar-columnas':
      case 'importar-resultado':
      case 'conflictos': {
        const step = screen === 'importar-columnas' ? 2 : screen === 'importar-resultado' ? 3 : 1;
        const queue = previewConflictQueue();
        return (
          <ImportView
            locale={locale}
            role={role}
            tab={screen === 'conflictos' ? 'conflictos' : 'importar'}
            imports={previewImportHistory(role)}
            own={previewOwnConflicts(role)}
            queue={screen === 'conflictos' ? queue : null}
            pendingConflicts={queue.pending.length}
            wizardInitial={
              step === 1
                ? undefined
                : {
                    step,
                    fileName: IMPORT_PREVIEW_FILE,
                    text: previewImportText(),
                    analysis: previewImportAnalysis(),
                    result: step === 3 ? previewImportResult() : undefined,
                  }
            }
          />
        );
      }
      case 'comisiones':
        return (
          <CommissionsView
            locale={locale}
            role={role}
            rows={previewCommissions(role)}
            query={parseCommissionQuery(search)}
          />
        );
      case 'clientes': {
        const { rows, owners } = previewClientList(role);
        return <ClientsView locale={locale} role={role} rows={rows} owners={owners} query={parseClientQuery(search)} />;
      }
      case 'cliente':
        return <ClientDetailView locale={locale} role={role} file={previewClientFile(role, search?.client === 'vacio')} />;
      case 'admin': {
        const t = await getTranslations({ locale, namespace: 'crm' });
        return (
          <>
            <PageHead title={t('summary.title')} tone={t('summary.titleTone.admin')} />
            <AdminSummary
              locale={locale}
              counters={ADMIN_COUNTERS}
              omen={PREVIEW_OMEN}
              omenCheckedAt={previewOmenCheckedAt()}
            />
          </>
        );
      }
    }
  }
}
