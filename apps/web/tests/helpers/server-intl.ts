import { createFormatter, createTranslator } from 'next-intl';

import { loadMessages } from '@/i18n/messages';

import type { Locale } from '@josecoded/types';

const catalogs = { es: await loadMessages('es'), en: await loadMessages('en') } as const;

/**
 * Stand-in for `next-intl/server` in component tests: the real catalogs and the real ICU formatter,
 * without a request. Use inside `vi.mock('next-intl/server', () => serverIntlMock)`.
 */
export const serverIntlMock = {
  getTranslations: async (options: { locale: Locale; namespace?: string } | string = { locale: 'es' }) => {
    const { locale, namespace } = typeof options === 'string' ? { locale: 'es' as Locale, namespace: options } : options;
    return createTranslator({ locale, messages: catalogs[locale], namespace: namespace as never });
  },
  getFormatter: async ({ locale }: { locale: Locale }) => createFormatter({ locale }),
};
