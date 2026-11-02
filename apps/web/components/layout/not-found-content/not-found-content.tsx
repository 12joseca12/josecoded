import { getTranslations } from 'next-intl/server';

import { getPathname } from '@/i18n/navigation';

import type { Locale } from '@josecoded/types';

// The link home is a plain anchor on purpose: Next renders a 404 as a client shell, and a soft
// navigation started from it before the router is ready (a click right after load) goes nowhere. A
// full page load always reaches the home of the right language.
//
// The one 404 markup, reused by [locale]/not-found.tsx (notFound() and unmatched URLs under a
// locale) and by the root app/not-found.tsx (URLs outside any locale, such as /foo.txt).
export async function NotFoundContent({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'notFound' });

  return (
    <main>
      <h1>{t('title')}</h1>
      <a href={getPathname({ href: '/', locale })}>{t('home')}</a>
    </main>
  );
}
