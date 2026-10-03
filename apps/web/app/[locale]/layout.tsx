import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'site' });
  return {
    metadataBase: new URL(env.client.NEXT_PUBLIC_SITE_URL),
    // pages set their own title; this one is the default and the suffix
    title: { default: t('name'), template: `%s · ${t('name')}` },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: LocaleParams;
}) {
  const locale = await resolveLocale(params);

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
