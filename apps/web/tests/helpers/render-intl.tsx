import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import { loadMessages } from '@/i18n/messages';

import type { Locale } from '@josecoded/types';
import type { ReactElement } from 'react';

const catalogs = { es: await loadMessages('es'), en: await loadMessages('en') } as const;

/** Renders inside the next-intl provider with the real catalog of the locale (localized `Link`s, `useTranslations`). */
export function renderIntl(ui: ReactElement, locale: Locale = 'es') {
  return render(
    <NextIntlClientProvider locale={locale} messages={catalogs[locale]}>
      {ui}
    </NextIntlClientProvider>,
  );
}
