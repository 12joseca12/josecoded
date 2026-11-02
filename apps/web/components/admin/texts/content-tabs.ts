import { TEXTS_PATH } from '@/lib/content/texts';
import { PRICING_PATH } from '@/lib/pricing/catalogue';

import type { TabItem } from '@/components/crm/tab-nav';

/** The tab strip of D2 Contenido, the same one on every tab: each one grows a count of what is unpublished in it. */
export function contentTabs(
  labels: { texts: string; prices: string },
  counts: { texts: number; prices: number },
): TabItem[] {
  return [
    { id: 'textos', label: labels.texts, href: TEXTS_PATH as `/${string}`, count: counts.texts },
    { id: 'precios', label: labels.prices, href: PRICING_PATH as `/${string}`, count: counts.prices },
  ];
}
