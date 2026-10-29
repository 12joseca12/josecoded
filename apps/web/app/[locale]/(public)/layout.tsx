import { PageFrame } from '@/components/layout/page-frame';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { ReactNode } from 'react';

// Every public page shares this frame: skip link, light field, header, <main id="main"> and footer.
export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: LocaleParams;
}) {
  await resolveLocale(params);
  return <PageFrame>{children}</PageFrame>;
}
