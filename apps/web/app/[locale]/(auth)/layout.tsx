import { PageFrame } from '@/components/layout/page-frame';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Sign-in screens: same frame as the public pages, never indexed (they hold no content of their own).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: LocaleParams;
}) {
  await resolveLocale(params);
  return <PageFrame>{children}</PageFrame>;
}
