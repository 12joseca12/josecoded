import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(env.client.NEXT_PUBLIC_SITE_URL),
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
