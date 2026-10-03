import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { resolveLocale } from '@/lib/locale';
import type { LocaleParams } from '@/lib/locale';

import type { Metadata } from 'next';

// Every URL without a page lands here (extension-less Spanish paths are rewritten under /es,
// English ones live under /en), so the 404 renders inside the localized layout: <html lang>, title
// and the single not-found component of [locale]/not-found.tsx. Next answers a notFound() raised
// on demand with status 404 plus a client-rendered shell, so the localized markup is checked in
// the browser (e2e/pages.spec.ts), not in the raw HTML.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'notFound' });
  return { title: t('title') };
}

export default async function UnmatchedPage({ params }: { params: LocaleParams }) {
  await resolveLocale(params);
  notFound();
}
