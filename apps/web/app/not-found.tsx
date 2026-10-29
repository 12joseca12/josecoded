import { getTranslations } from 'next-intl/server';

import { NotFoundContent } from '@/components/layout/not-found-content';
import { routing } from '@/i18n/routing';
import { fontVariables } from '@/lib/fonts';

import '@/styles/globals.css';

// URLs that no locale route handles (e.g. /foo.txt, /api/unknown). Everything under /en/... and
// every extension-less Spanish path reaches [locale]/not-found.tsx instead, so the language comes
// from the route there; here the default locale is used.
export default async function RootNotFound() {
  const locale = routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'notFound' });

  return (
    <html lang={locale} className={fontVariables}>
      <head>
        <title>{t('title')}</title>
      </head>
      <body>
        <NotFoundContent locale={locale} />
      </body>
    </html>
  );
}
