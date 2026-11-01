import { PageFrame } from '@/components/layout/page-frame';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Private screens (profile, client area): same frame as the public pages, never indexed. The guard is
// NOT here: a layout does not re-run on client navigation and does not know the path, so every page
// calls `requireUser` itself (lib/auth/guards).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AreaGroupLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: LocaleParams;
}) {
  await resolveLocale(params);
  return <PageFrame>{children}</PageFrame>;
}
