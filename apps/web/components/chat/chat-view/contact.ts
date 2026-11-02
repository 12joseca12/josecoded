import { getTranslations } from 'next-intl/server';

import { bookingHref, whatsappHref } from '@/components/home/links';
import { loadFacts } from '@/lib/seo/facts-server';

import type { ChatContact, Href, Locale } from '@josecoded/types';

/** The direct ways to reach Jose that the chat offers (same sources as `/partners`: facts, Cal.com, WhatsApp). */
export async function loadChatContact(locale: Locale): Promise<ChatContact> {
  const factsT = await getTranslations({ locale, namespace: 'facts' });
  const facts = await loadFacts(locale);
  return {
    whatsapp: whatsappHref(String(factsT.raw('whatsappProject'))),
    book: bookingHref(),
    email: facts.email,
    linkedin: facts.linkedinUrl as Href | undefined,
  };
}
