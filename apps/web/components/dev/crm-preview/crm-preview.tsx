import { getTranslations } from 'next-intl/server';

import { ContactDetailView } from '@/components/crm/contact-detail';
import { ContactsView } from '@/components/crm/contacts-view';
import { getStatusOptions, getStatusSheetLabels } from '@/components/crm/status-sheet';
import { PageHead } from '@/components/staff/page-head';
import { StaffShell } from '@/components/staff/staff-shell';
import { AdminSummary, CrmSummary } from '@/components/staff/summary';
import { ADMIN_COUNTERS, PREVIEW_IDENTITY, PREVIEW_OMEN, previewContactDetail, previewContactPage, previewOverdue, previewSummary } from '@/lib/dev/crm-fixtures';

import type { StaffRole } from '@/lib/auth/staff';
import type { PreviewScreen } from '@/lib/dev/crm-previews';
import type { Locale } from '@josecoded/types';

/**
 * One screen of /crm or /admin with fixtures instead of Supabase, inside the real `StaffShell`. It composes the same
 * views the real pages compose (`CrmSummary`, `ContactsView`, `ContactDetailView`, `AdminSummary`); only the reads
 * are replaced. Gated by `requireDevUi()` in the route.
 */
export async function CrmPreview({ locale, screen, role, tab }: { locale: Locale; screen: PreviewScreen; role: StaffRole; tab?: string }) {
  const summary = previewSummary(role);
  const overdue = (role === 'admin' ? summary.admin?.contacts_due : summary.my.contacts_due) ?? 0;
  const [statusOptions, statusLabels] = await Promise.all([getStatusOptions(role, locale), getStatusSheetLabels(locale)]);

  return (
    <StaffShell locale={locale} zone={screen === 'admin' ? 'admin' : 'crm'} role={role} identity={PREVIEW_IDENTITY[role]} overdue={overdue}>
      {await screenOf()}
    </StaffShell>
  );

  async function screenOf() {
    switch (screen) {
      case 'resumen':
        return <CrmSummary locale={locale} summary={summary} overdue={previewOverdue(role)} omen={PREVIEW_OMEN} />;
      case 'contactos':
        return <ContactsView locale={locale} role={role} page={previewContactPage(role)} statusOptions={statusOptions} statusLabels={statusLabels} />;
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
      case 'admin': {
        const t = await getTranslations({ locale, namespace: 'crm' });
        return (
          <>
            <PageHead title={t('summary.title')} tone={t('summary.titleTone.admin')} />
            <AdminSummary locale={locale} counters={ADMIN_COUNTERS} omen={PREVIEW_OMEN} />
          </>
        );
      }
    }
  }
}
