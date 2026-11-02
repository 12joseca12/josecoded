import { getTranslations } from 'next-intl/server';

import { ErrorLink, ErrorPage } from '@/components/shared/error-page';
import { getPathname } from '@/i18n/navigation';

import type { Locale } from '@josecoded/types';

// The links are plain anchors on purpose: Next renders a 404 as a client shell, and a soft navigation started
// from it before the router is ready (a click right after load) goes nowhere. A full page load always reaches
// the right page in the right language.
//
// The one 404 markup, reused by (public)/not-found.tsx (inside the site frame: header, footer, `<main>`), by
// [locale]/not-found.tsx and by the root app/not-found.tsx (URLs outside any locale, such as /foo.txt), which
// have no frame and so bring their own `<main>` (`framed={false}`).
export async function NotFoundContent({ locale, framed = false }: { locale: Locale; framed?: boolean }) {
  const t = await getTranslations({ locale, namespace: 'notFound' });
  const errors = await getTranslations({ locale, namespace: 'errors.notFound' });
  const path = (href: '/' | '/servicios' | '/proyectos' | '/contacto') => getPathname({ href, locale });

  const page = (
    <ErrorPage
      code={errors('code')}
      title={t('title')}
      text={errors('text')}
      actions={
        <ErrorLink href={path('/')} primary>
          {t('home')}
        </ErrorLink>
      }
      linksLabel={(await getTranslations({ locale, namespace: 'errors' }))('useful')}
      links={
        <>
          <ErrorLink href={path('/servicios')}>{errors('links.services')}</ErrorLink>
          <ErrorLink href={path('/proyectos')}>{errors('links.projects')}</ErrorLink>
          <ErrorLink href={path('/contacto')}>{errors('links.contact')}</ErrorLink>
        </>
      }
    />
  );
  return framed ? page : <main>{page}</main>;
}
