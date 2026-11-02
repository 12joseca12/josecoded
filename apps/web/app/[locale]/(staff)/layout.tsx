import { PageFrame } from '@/components/layout/page-frame';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Staff screens (CRM): same frame as the other private groups, never indexed. The guard lives in each page
// and in the CRM layout (`requireStaff`), because a layout alone does not re-run on client navigation.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StaffGroupLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: LocaleParams;
}) {
  await resolveLocale(params);
  return <PageFrame>{children}</PageFrame>;
}
