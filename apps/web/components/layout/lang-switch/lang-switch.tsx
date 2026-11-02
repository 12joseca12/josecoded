'use client';

import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { getPathname, usePathname } from '@/i18n/navigation';

import styles from './lang-switch.module.css';

import type { Locale, LangSwitchVariant } from '@josecoded/types';
type PathHref = Parameters<typeof getPathname>[0]['href'];

// segments of the route that are not a page parameter of the screen
const NOT_PARAMS = new Set(['locale', 'rest']);

/**
 * Language switch. `inline` is the short code of the other language in the header (EN on a Spanish
 * page); `segmented` lists both languages inside the ☰ menu with the current one marked. Both go
 * to the same screen in the other language: the route template (`/proyectos/[slug]`) and its
 * parameters are handed to the localized `Link`, so a dynamic page keeps its slug and the
 * translated path (`/en/projects/3cat`) comes out right.
 *
 * A11y: a link named by the language it goes to («English», not «EN»; the visible code is part of
 * the name) with `lang` and `hreflang`; the segmented form is a `role="group"` named «Idioma» and
 * the current language is `aria-current="true"`; contrast text-2 and text on overlay.
 */
export function LangSwitch({ variant = 'inline' }: { variant?: LangSwitchVariant }) {
  const t = useTranslations('nav.language');
  const locale = useLocale() as Locale;
  const pathname = usePathname() ?? '/';
  const rawParams = useParams();

  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawParams ?? {})) {
    if (NOT_PARAMS.has(key) || value === undefined) continue;
    params[key] = Array.isArray(value) ? value.join('/') : value;
  }
  const href = (
    Object.keys(params).length > 0 ? { pathname, params } : { pathname }
  ) as unknown as PathHref;

  const other: Locale = locale === 'es' ? 'en' : 'es';
  const link = (target: Locale, text: string) => (
    // the final URL is computed here (`/servicios`, `/en/services`) so it is canonical in one hop;
    // the plain Next link still navigates on the client
    <NextLink
      href={getPathname({ href, locale: target })}
      lang={target}
      hrefLang={target}
      aria-label={t(target)}
    >
      {text}
    </NextLink>
  );

  if (variant === 'inline') {
    return (
      <span className={styles.inline} data-variant="inline">
        {link(other, t(`short.${other}`))}
      </span>
    );
  }

  return (
    <div role="group" aria-label={t('label')} className={styles.segmented} data-variant="segmented">
      {(['es', 'en'] as const).map((code) =>
        code === locale ? (
          <span key={code} aria-current="true" lang={code}>
            {t(code)}
          </span>
        ) : (
          <span key={code} className={styles.option}>
            {link(code, t(code))}
          </span>
        ),
      )}
    </div>
  );
}
