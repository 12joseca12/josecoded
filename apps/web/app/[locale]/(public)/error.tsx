'use client';

import { useLocale, useTranslations } from 'next-intl';

import { ErrorLink, ErrorPage } from '@/components/shared/error-page';
import { Button } from '@/components/ui/button';
// 500 of a public page (pantallas v2.0 P19). It is a client boundary; the public layout hands the browser the
// `errors.server` sentences only (the site ships no other messages to it).
export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useLocale();
  const t = useTranslations('errors.server');
  return (
    <ErrorPage
      code={t('code')}
      title={t('title')}
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
