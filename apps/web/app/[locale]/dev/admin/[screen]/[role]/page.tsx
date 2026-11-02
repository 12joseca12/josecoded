import { notFound } from 'next/navigation';

import { AdminPreview } from '@/components/dev/admin-preview';
import { ADMIN_PREVIEW_SCREENS } from '@/lib/dev/admin-previews';
import { requireDevUi } from '@/lib/dev/gate';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';

type Params = Promise<{ locale: string; screen: string; role: string }>;

/** `/dev/admin/<screen>/admin`: the real view of an admin screen fed with fixtures, inside the real `StaffShell`. */
export default async function DevAdminScreenPage({ params }: { params: Params }) {
  requireDevUi();
  const { screen, role } = await params;
  const locale = await resolveLocale(params as unknown as LocaleParams);
  const known = ADMIN_PREVIEW_SCREENS.find((candidate) => candidate === screen);
  if (!known || role !== 'admin') notFound();
  return <AdminPreview locale={locale} screen={known} />;
}
