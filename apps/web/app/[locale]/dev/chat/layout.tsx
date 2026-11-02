import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { PageFrame } from '@/components/layout/page-frame';
import { requireDevUi } from '@/lib/dev/gate';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Dev-only preview of the chat screen with fixtures (block B02). Same gate as /dev/ui and /dev/crm: 404 in
// production, never indexed, absent from the sitemap. It lives in the public frame, like the real /chat.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DevChatLayout({ children }: { children: ReactNode }) {
  requireDevUi();
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={{ errors: { server: messages.errors.server } }}>
      <PageFrame>{children}</PageFrame>
    </NextIntlClientProvider>
  );
}
