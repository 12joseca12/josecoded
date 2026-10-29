import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { UiCatalogue } from '@/components/dev/ui-catalogue';
import { env } from '@/lib/env';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

// Catalogue of components/ui (working-agreements §15.4): it exists only where NEXT_PUBLIC_DEV_UI=1
// (local, wrangler dev and the preview of a PR). In production the variable is absent and the route
// answers 404; it is never indexed and the sitemap does not list it.
const enabled = env.client.NEXT_PUBLIC_DEV_UI === '1';

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
