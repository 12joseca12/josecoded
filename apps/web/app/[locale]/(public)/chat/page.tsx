import { getTranslations } from 'next-intl/server';

import { CHAT_CASES } from '@josecoded/types';

import { ChatView, loadChatContact } from '@/components/chat/chat-view';
import { chatFixture } from '@/lib/dev/chat-fixtures';
import { resolveLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo/page-metadata';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'chat.meta' });
  // noindex while the thread is example data (B02); B03 connects the gateway and decides the indexing
  return { ...pageMetadata({ locale, pathname: '/chat', title: t('title'), description: t('description') }), robots: { index: false, follow: true } };
}

// P11 (pantallas v2.0): chat by case. TODO(B03): replace the example data with the real thread and the send action.
export default async function ChatPage({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const locale = await resolveLocale(params);
  const raw = (await searchParams).case;
  const asked = Array.isArray(raw) ? raw[0] : raw;
  const chatCase = CHAT_CASES.find((id) => id === asked) ?? 'client';
  return <ChatView data={chatFixture('vacio', chatCase, locale)} contact={await loadChatContact(locale)} locale={locale} />;
}
