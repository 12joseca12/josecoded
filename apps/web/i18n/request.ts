import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { loadMessages } from './messages';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // The locale is the one the route set with setRequestLocale() (layouts and pages); there is no
  // middleware and no header sniffing. Anything else falls back to the default locale.
  const candidate = await requestLocale;
  const locale = hasLocale(routing.locales, candidate) ? candidate : routing.defaultLocale;
  return { locale, messages: await loadMessages(locale) };
});
