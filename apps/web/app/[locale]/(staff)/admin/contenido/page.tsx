import { getTranslations } from 'next-intl/server';

import { pricing } from '@josecoded/pricing';

import { PricesView } from '@/components/admin/pricing';
import { requireAdmin } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';
import { PRICING_PATH, catalogueFromPricing } from '@/lib/pricing/catalogue';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'adminPricing' });
  return { title: t('metaTitle') };
}

/**
 * D2, Contenido: for now only its Precios tab (`?tab=precios`, the other tabs arrive with B35–B42). The page shows the
 * published catalogue (`content/pricing.json`) and says that saving is not wired yet: the draft, `admin_pricing_*`
 * and the Server Actions are B40, which replaces the stub of the sheet and this read.
 */
export default async function AdminContentPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  await requireAdmin({ locale, next: PRICING_PATH });
  const t = await getTranslations({ locale, namespace: 'adminPricing' });
  return <PricesView locale={locale} catalogue={catalogueFromPricing(pricing)} notice={t('notWired')} />;
}
