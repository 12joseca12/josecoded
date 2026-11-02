'use client';

import { useSyncExternalStore } from 'react';

import { GuidedChat } from './guided-chat';

import type { GuidedChatLabels } from './guided-chat';
import type { Href, Locale } from '@josecoded/types';

const subscribeNothing = () => () => undefined;

/**
 * Reads `?pack=` (from `/servicios`) and `?q=` (the prompt of the home) after hydration, so the page itself
 * stays static, and starts the chat with them. The chat is keyed by the query: it restarts once if the
 * visitor arrived with one.
 */
export function GuidedChatEntry(props: {
  locale: Locale;
  apiUrl: string;
  siteKey: string;
  labels: GuidedChatLabels;
  email?: string;
  whatsapp?: Href;
}) {
  const search = useSyncExternalStore(subscribeNothing, () => window.location.search, () => '');
  const params = new URLSearchParams(search);
  return <GuidedChat key={search} {...props} pack={params.get('pack') ?? undefined} query={params.get('q')?.slice(0, 120) ?? undefined} />;
}
