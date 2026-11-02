import { notFound } from 'next/navigation';

import { CrmPreview } from '@/components/dev/crm-preview';
import { findPreview } from '@/lib/dev/crm-previews';
import { requireDevUi } from '@/lib/dev/gate';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';

type Params = Promise<{ locale: string; screen: string; role: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * `/dev/crm/<screen>/<role>`: the real screen of /crm or /admin fed with fixtures and inside the real `StaffShell`.
 * `LocaleParams` is `{ locale }`; the extra segments are checked here and anything unknown is a 404.
 */
export default async function DevCrmScreenPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  requireDevUi();
  const { screen, role } = await params;
  const locale = await resolveLocale(params as unknown as LocaleParams);
  const raw = await searchParams;
  const preview = findPreview(screen, role);
  if (!preview) notFound();
  const tab = Array.isArray(raw.tab) ? raw.tab[0] : raw.tab;
  return <CrmPreview locale={locale} screen={preview.screen} role={preview.role} tab={tab} />;
}
