import { AreaPreviewIndex } from '@/components/dev/area-preview';
import { requireDevUi } from '@/lib/dev/gate';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';

export default async function DevAreaStoriesIndex({ params }: { params: LocaleParams }) {
  requireDevUi();
  const locale = await resolveLocale(params);
  return <AreaPreviewIndex locale={locale} />;
}
