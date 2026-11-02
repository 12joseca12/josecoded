import { StaffShell } from '@/components/staff/staff-shell';
import { requireAdmin } from '@/lib/auth/guards';
import { getStaffIdentity } from '@/lib/crm/queries';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { ReactNode } from 'react';

/** `/admin` is for the admin alone: a closer, a client or a visitor with a session gets a 404 (DATOS §8.1). */
export default async function AdminLayout({ children, params }: { children: ReactNode; params: LocaleParams }) {
  const locale = await resolveLocale(params);
  await requireAdmin({ locale, next: '/admin' });
  const identity = await getStaffIdentity();
  return (
    <StaffShell locale={locale} zone="admin" role="admin" identity={identity}>
      {children}
    </StaffShell>
  );
}
