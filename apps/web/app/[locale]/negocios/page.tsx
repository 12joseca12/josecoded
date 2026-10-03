import { getTranslations } from 'next-intl/server';

import { resolveLocale } from '@/lib/locale';
import type { LocaleParams } from '@/lib/locale';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'business' });
  return { title: t('title') };
}

// Placeholder so the URL matrix (/negocios, /en/business) has a real page. The page is task 3.3.
export default async function BusinessPage({ params }: { params: LocaleParams }) {
  await resolveLocale(params);
  const t = await getTranslations();

  return (
    <main>
      <h1>{t('business.title')}</h1>
    </main>
  );
}
