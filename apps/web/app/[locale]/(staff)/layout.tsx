import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Staff screens (/crm, /admin): never indexed. They bring their own frame (`StaffShell`, with its rail and bars)
// instead of the public header and footer. The guard lives in each page and in the layout of each zone, because a
// layout alone does not re-run on client navigation.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StaffGroupLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: LocaleParams;
}) {
  await resolveLocale(params);
  return children;
}
