import type { routing } from './i18n/routing';

// Typed message keys (working-agreements §14.4): `t('site.nope')` does not compile.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof import('./messages/es').default;
  }
}
