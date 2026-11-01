import { AreaShell } from '@/components/area/area-shell';
import { getAreaContext } from '@/lib/area/queries';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { ReactNode } from 'react';

/**
 * Shell of the client area. It does not guard: an anonymous visitor gets the page's own redirect (with
 * the right `next`), and the shell only renders for a real session.
 */
export default async function AreaLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: LocaleParams;
}) {
  const locale = await resolveLocale(params);
  const context = await getAreaContext();
  if (!context) return children;
  return (
    <AreaShell locale={locale} isClient={context.client !== null}>
      {children}
    </AreaShell>
  );
}
