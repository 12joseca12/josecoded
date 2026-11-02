import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { PageFrame } from '@/components/layout/page-frame';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { ReactNode } from 'react';

// Every public page shares this frame: skip link, light field, header, <main id="main"> and footer.
export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: LocaleParams;
}) {
  await resolveLocale(params);
  // the error boundary of the public pages is a client component: it gets its own few sentences, nothing else
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={{ errors: { server: messages.errors.server } }}>
      <PageFrame>{children}</PageFrame>
    </NextIntlClientProvider>
  );
}
