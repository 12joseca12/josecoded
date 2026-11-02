import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { UiCatalogue } from '@/components/dev/ui-catalogue';
import { devUiEnabled } from '@/lib/dev/gate';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

// Catalogue of components/ui (working-agreements §15.4): gated by `devUiEnabled` (lib/dev/gate.ts), so in
// production the route answers 404; it is never indexed and the sitemap does not list it.
const enabled = devUiEnabled;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  if (!enabled) return {};
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'dev.ui' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function DevUiPage({ params }: { params: LocaleParams }) {
  await resolveLocale(params);
  if (!enabled) notFound();
  return <UiCatalogue />;
}
