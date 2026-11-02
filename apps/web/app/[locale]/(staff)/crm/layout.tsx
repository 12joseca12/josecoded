import { requireStaff } from '@/lib/auth/staff';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { ReactNode } from 'react';

/** The CRM is for active staff with a second factor: anyone else gets the login, the profile or a 404 (task 6.0). */
export default async function CrmLayout({ children, params }: { children: ReactNode; params: LocaleParams }) {
  const locale = await resolveLocale(params);
  await requireStaff({ locale, next: '/crm' });
  return children;
}
