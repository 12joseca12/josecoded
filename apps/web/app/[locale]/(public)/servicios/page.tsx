import { getTranslations } from 'next-intl/server';

import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'services' });
  return { title: t('title') };
}

// Placeholder so the URL matrix (/servicios, /en/services, and the 301s of the retired /negocios
// and /empresas that land here) has a real page. The page is task 3.2.
export default async function ServicesPage({ params }: { params: LocaleParams }) {
  await resolveLocale(params);
  const t = await getTranslations();

  return (
    <h1>{t('services.title')}</h1>
  );
}
