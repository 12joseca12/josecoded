import { defineRouting } from 'next-intl/routing';

import { pathnames } from './pathnames';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  localeDetection: false,
  pathnames,
});
