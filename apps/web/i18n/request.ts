import { locale as rootLocale } from 'next/root-params';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

// One module per locale composes the per-screen JSON files (messages/<locale>/<screen>.json).
// The explicit loaders keep each locale in its own chunk.
const loaders = {
  es: () => import('../messages/es'),
  en: () => import('../messages/en'),
} as const;

export default getRequestConfig(async () => {
  // the locale comes from the route params, not from headers: there is no middleware
  const candidate = await rootLocale();
  const locale = hasLocale(routing.locales, candidate) ? candidate : routing.defaultLocale;
  return { locale, messages: (await loaders[locale]()).default };
});
