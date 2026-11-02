import { CrmPreviewIndex } from '@/components/dev/crm-preview';
import { requireDevUi } from '@/lib/dev/gate';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';

export default async function DevCrmPage({ params }: { params: LocaleParams }) {
  requireDevUi();
  const locale = await resolveLocale(params);
  return <CrmPreviewIndex locale={locale} />;
}
