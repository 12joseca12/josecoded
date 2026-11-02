'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { ErrorLink, ErrorPage } from '@/components/shared/error-page';
import { Button } from '@/components/ui/button';

// 500 of a staff screen (a counter that cannot be read, a failed query). It is a client boundary; the staff layout
// hands the browser the `crm.error` sentences only. It replaces the page without a navigation, so the title says so
// and focus lands on it.
export default function StaffError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useLocale();
  const t = useTranslations('crm.error');
  const title = t('title');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = title;
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
          <ErrorLink href={locale === 'en' ? '/en/crm' : '/crm'}>{t('home')}</ErrorLink>
        </>
      }
    />
  );
}
