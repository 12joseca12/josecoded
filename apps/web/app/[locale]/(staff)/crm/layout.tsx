import { StaffShell } from '@/components/staff/staff-shell';
import { requireStaff } from '@/lib/auth/staff';
import { getOverdueCount, getStaffIdentity } from '@/lib/crm/queries';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { ReactNode } from 'react';

/**
 * The CRM is for active staff with a second factor: anyone else gets the login, the profile or a 404 (task 6.0).
 * Its frame is the shared `StaffShell` with the navigation of /crm; the overdue count on Contactos comes from the
 * one cached RPC the role needs (shared with the summary), and a failure only hides the badge.
 */
export default async function CrmLayout({ children, params }: { children: ReactNode; params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const { role } = await requireStaff({ locale, next: '/crm' });
  const [identity, overdue] = await Promise.all([getStaffIdentity(), getOverdueCount(role)]);
  return (
    <StaffShell locale={locale} zone="crm" role={role} identity={identity} overdue={overdue ?? 0}>
      {children}
    </StaffShell>
  );
}
