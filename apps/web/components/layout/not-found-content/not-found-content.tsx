import NextLink from 'next/link';
import { getTranslations } from 'next-intl/server';

import { getPathname } from '@/i18n/navigation';

import type { Locale } from '@josecoded/types';

// The one 404 markup, reused by [locale]/not-found.tsx (notFound() and unmatched URLs under a
// locale) and by the root app/not-found.tsx (URLs outside any locale, such as /foo.txt).
export async function NotFoundContent({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'notFound' });

  return (
    <main>
      <h1>{t('title')}</h1>
      <NextLink href={getPathname({ href: '/', locale })}>{t('home')}</NextLink>
    </main>
  );
}
