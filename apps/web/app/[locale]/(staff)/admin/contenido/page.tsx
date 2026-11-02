import { getTranslations } from 'next-intl/server';

import { pricing } from '@josecoded/pricing';
import { pricingSchema } from '@josecoded/types';

import { PricesView } from '@/components/admin/pricing';
import { requireAdmin } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';
import { PRICING_PATH } from '@/lib/pricing/catalogue';
import { diffCatalog } from '@/lib/pricing/diff';
import { catalogueFromDraft } from '@/lib/pricing/draft';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'adminPricing' });
  return { title: t('metaTitle') };
}

/**
 * D2, Contenido: for now only its Precios tab (`?tab=precios`, the other tabs arrive with B35–B42). The page shows the
 * DRAFT catalogue (the tables, read with the admin's JWT: what the Server Actions write) and marks what differs from
 * the published one (`content/pricing.json`, which is what the public site keeps reading until a publication).
 */
export default async function AdminContentPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const { supabase } = await requireAdmin({ locale, next: PRICING_PATH });

  const [packs, options, extras, settings, snapshot] = await Promise.all([
    supabase.from('packs').select('*'),
    supabase.from('pack_options').select('*'),
    supabase.from('extras').select('*'),
    supabase.from('pricing_settings').select('hourly, feature').single(),
    supabase.rpc('pricing_catalog_snapshot'),
  ]);
  if (packs.error || options.error || extras.error || settings.error) throw new Error('pricing draft unreadable');

  // The draft as the file would be written; an invalid one (a price at 0, say) cannot be diffed and says so.
  const draft = pricingSchema.safeParse(snapshot.data);
  const changes = draft.success ? diffCatalog(pricing, draft.data) : null;
  const catalogue = catalogueFromDraft(
    { packs: packs.data, options: options.data, extras: extras.data, settings: settings.data },
    changes ?? [],
  );
  return <PricesView locale={locale} catalogue={catalogue} changes={changes} />;
}
