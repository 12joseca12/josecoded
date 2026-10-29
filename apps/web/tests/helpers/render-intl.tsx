import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import type { Locale } from '@josecoded/types';
import type { ReactElement } from 'react';

/** Renders inside the next-intl provider that localized `Link`s need. */
export function renderIntl(ui: ReactElement, locale: Locale = 'es') {
  return render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      {ui}
    </NextIntlClientProvider>,
  );
}
