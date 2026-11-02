import { getTranslations } from 'next-intl/server';

import { CHAT_CASES } from '@josecoded/types';

import { ChatView, loadChatContact } from '@/components/chat/chat-view';
import { getOptionalSession } from '@/lib/auth/guards';
import { env } from '@/lib/env';
import { resolveLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo/page-metadata';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'chat.meta' });
  return pageMetadata({ locale, pathname: '/chat', title: t('title'), description: t('description') });
}

// P11 (pantallas v2.0): chat by case against the gateway (`assistant/*`, B03). The thread itself is read in the browser,
// where the visitor's cookie is; the server only knows whether a user is signed in (to offer «save» and claim).
export default async function ChatPage({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const locale = await resolveLocale(params);
  const raw = (await searchParams).case;
  const asked = Array.isArray(raw) ? raw[0] : raw;
  const initialCase = CHAT_CASES.find((id) => id === asked) ?? 'client';
  const session = await getOptionalSession();
  return (
    <ChatView
      data={{ case: initialCase, thread: [], quota: { used: 0, limit: 1 }, handover: false, signedIn: session !== null }}
      contact={await loadChatContact(locale)}
      locale={locale}
      live={{
        apiUrl: env.client.NEXT_PUBLIC_JOSECODED_API_URL,
        siteKey: env.client.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        signedIn: session !== null,
        initialCase,
      }}
    />
  );
}
