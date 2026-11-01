import { env } from '@/lib/env';

import type { Href } from '@josecoded/types';

/** Cal.com page of the 20-minute call (`NEXT_PUBLIC_CAL_LINK`, e.g. `josecoded/20min`). */
export function bookingHref(): Href {
  return `https://cal.com/${env.client.NEXT_PUBLIC_CAL_LINK}`;
}

/**
 * WhatsApp chat with the prefilled text of the page (`facts.whatsappProject`, `facts.whatsappPacks`).
 * While that text is pending the chat opens empty: the number is never missing, it is a required
 * public variable.
 */
export function whatsappHref(prefilled: string): Href {
  const base = `https://wa.me/${env.client.NEXT_PUBLIC_WHATSAPP_NUMBER}`;
  return prefilled.includes('{{DATO') || prefilled.trim() === '' ? (base as Href) : (`${base}?text=${encodeURIComponent(prefilled)}` as Href);
}
