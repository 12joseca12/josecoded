import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { PageFrame } from '@/components/layout/page-frame';
import { requireDevUi } from '@/lib/dev/gate';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Dev-only previews of the client area screens with fixtures (block B15). Same gate as /dev/ui, /dev/crm and
// /dev/chat: 404 in production, never indexed, absent from the sitemap. They live in the public frame, like the real area.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DevAreaLayout({ children }: { children: ReactNode }) {
  requireDevUi();
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={{ errors: { server: messages.errors.server } }}>
      <PageFrame>{children}</PageFrame>
    </NextIntlClientProvider>
  );
}
