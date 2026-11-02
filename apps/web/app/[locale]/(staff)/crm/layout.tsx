import { StaffShell } from '@/components/staff/staff-shell';
import { requireStaff } from '@/lib/auth/staff';
import { getCrmSummary, getStaffIdentity } from '@/lib/crm/queries';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { ReactNode } from 'react';

/**
 * The CRM is for active staff with a second factor: anyone else gets the login, the profile or a 404 (task 6.0).
 * Its frame is the shared `StaffShell` with the navigation of /crm; the overdue count on Contactos comes from the
 * same cached RPCs as the summary, so a render asks the database once.
 */
export default async function CrmLayout({ children, params }: { children: ReactNode; params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const { role } = await requireStaff({ locale, next: '/crm' });
  const [identity, summary] = await Promise.all([getStaffIdentity(), getCrmSummary(role)]);
  const overdue = role === 'admin' ? (summary.admin?.contacts_due ?? 0) : summary.my.contacts_due;
  return (
    <StaffShell locale={locale} zone="crm" role={role} identity={identity} overdue={overdue}>
      {children}
    </StaffShell>
  );
}
