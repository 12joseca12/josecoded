'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { ErrorLink, ErrorPage } from '@/components/shared/error-page';
import { Button } from '@/components/ui/button';

// 500 of a public page (pantallas v2.0 P19). It is a client boundary; the public layout hands the browser the
// `errors.server` sentences only (the site ships no other messages to it).
export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useLocale();
  const t = useTranslations('errors.server');
  const title = t('title');
  const heading = useRef<HTMLHeadingElement>(null);
  // the boundary replaces the page without a navigation: the title says so and focus lands on it
  useEffect(() => {
    document.title = `${title} · josecoded`;
    heading.current?.focus();
  }, [title]);
  return (
    <ErrorPage
      headingRef={heading}
      code={t('code')}
      title={title}
      text={t('text')}
      actions={
        <>
          <Button onClick={reset}>{t('retry')}</Button>
          <ErrorLink href={locale === 'en' ? '/en' : '/'}>{t('home')}</ErrorLink>
          <ErrorLink href={locale === 'en' ? '/en/contact' : '/contacto'}>{t('contact')}</ErrorLink>
        </>
      }
    />
  );
}
