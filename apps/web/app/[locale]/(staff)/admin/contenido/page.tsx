import { getTranslations } from 'next-intl/server';

import { pricing } from '@josecoded/pricing';
import { pricingSchema } from '@josecoded/types';

import { PricesView } from '@/components/admin/pricing';
import { TextsView } from '@/components/admin/texts';
import { loadMessages } from '@/i18n/messages';
import { requireAdmin } from '@/lib/auth/guards';
import { collectTexts } from '@/lib/content/texts';
import { resolveLocale } from '@/lib/locale';
import { PRICING_PATH } from '@/lib/pricing/catalogue';
import { diffCatalog } from '@/lib/pricing/diff';
import { catalogueFromDraft } from '@/lib/pricing/draft';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** `?tab=precios` is the prices; anything else is the texts, the first tab. */
const tabOf = async (searchParams: SearchParams) => ((await searchParams).tab === 'precios' ? 'precios' : 'textos');

export async function generateMetadata({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const tab = await tabOf(searchParams);
  const t = await getTranslations({ locale, namespace: tab === 'precios' ? 'adminPricing' : 'adminTexts' });
  return { title: t('metaTitle') };
}

/**
 * D2, Contenido, with its Textos (`?tab=textos`, the default) and Precios (`?tab=precios`) tabs; the others arrive with
 * B41–B42. Textos lists every editable text of the site from the real catalogs; saving them is B38. Precios shows the
 * DRAFT catalogue (the tables, read with the admin's JWT: what the Server Actions write) and marks what differs from
 * the published one (`content/pricing.json`, which is what the public site keeps reading until a publication).
 */
export default async function AdminContentPage({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const locale = await resolveLocale(params);
  const { supabase } = await requireAdmin({ locale, next: PRICING_PATH });

  if ((await tabOf(searchParams)) === 'textos') {
    const [es, en, t] = await Promise.all([loadMessages('es'), loadMessages('en'), getTranslations({ locale, namespace: 'adminTexts' })]);
    return <TextsView entries={collectTexts(es, en)} notice={t('unwired')} />;
  }

  const [packs, options, extras, settings, snapshot] = await Promise.all([
    supabase.from('packs').select('*'),
    supabase.from('pack_options').select('*'),
    supabase.from('extras').select('*'),
    supabase.from('pricing_settings').select('hourly, feature').single(),
    supabase.rpc('pricing_catalog_snapshot'),
  ]);
  if (packs.error || options.error || extras.error || settings.error || snapshot.error) throw new Error('pricing draft unreadable');

  // The draft as the file would be written; an invalid one (a price at 0, say) cannot be diffed and says so.
  const draft = pricingSchema.safeParse(snapshot.data);
  const changes = draft.success ? diffCatalog(pricing, draft.data) : null;
  const catalogue = catalogueFromDraft(
    { packs: packs.data, options: options.data, extras: extras.data, settings: settings.data },
    changes ?? [],
  );
  return <PricesView locale={locale} catalogue={catalogue} changes={changes} />;
}
