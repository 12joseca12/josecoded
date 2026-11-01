import { getTranslations } from 'next-intl/server';

import { formatPrice, pricing } from '@josecoded/pricing';

import { resolveLocale } from '@/lib/locale';

import { pageMetadata } from './page-metadata';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

/**
 * `generateMetadata` of the home (`/` and `/en`): `export { generateMetadata } from '@/lib/seo/home-metadata'` in
 * `app/[locale]/(public)/page.tsx`. Title and description come from `messages/*\/seo.json`; the price is `pricing`'s.
 */
export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'seo' });
  const from = formatPrice(Math.min(...pricing.packs.map((pack) => pack.price)), locale);
  return pageMetadata({ locale, pathname: '/', title: t('home.title'), description: t('home.description', { price: from }) });
}
