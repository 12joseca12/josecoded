import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

// One module per locale composes the per-screen JSON files (messages/<locale>/<screen>.json).
// The explicit loaders keep each locale in its own chunk.
const loaders = {
  es: () => import('../messages/es'),
  en: () => import('../messages/en'),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  // The locale is the one the route set with setRequestLocale() (layouts and pages); there is no
  // middleware and no header sniffing. Anything else falls back to the default locale.
  const candidate = await requestLocale;
  const locale = hasLocale(routing.locales, candidate) ? candidate : routing.defaultLocale;
  return { locale, messages: (await loaders[locale]()).default };
});
