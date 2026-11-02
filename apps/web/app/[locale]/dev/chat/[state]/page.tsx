import { notFound } from 'next/navigation';

import { CHAT_CASES } from '@josecoded/types';

import { ChatView, loadChatContact } from '@/components/chat/chat-view';
import { chatFixture } from '@/lib/dev/chat-fixtures';
import { findChatState } from '@/lib/dev/chat-previews';
import { requireDevUi } from '@/lib/dev/gate';
import { resolveLocale } from '@/lib/locale';

type Params = Promise<{ locale: string; state: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** `/dev/chat/<vacio|conversacion|cuota|jose>[?case=…]`: the real `ChatView` fed with fixtures. */
export default async function DevChatPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  requireDevUi();
  const { state } = await params;
  const locale = await resolveLocale(params);
  const preview = findChatState(state);
  if (!preview) notFound();
  const raw = (await searchParams).case;
  const asked = Array.isArray(raw) ? raw[0] : raw;
  const chatCase = CHAT_CASES.find((id) => id === asked) ?? 'client';
  return <ChatView data={chatFixture(preview, chatCase, locale)} contact={await loadChatContact(locale)} locale={locale} />;
}
