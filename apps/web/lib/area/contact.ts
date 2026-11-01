import { env } from '@/lib/env';

/** WhatsApp chat with Jose (number from the public env; the prefilled text is optional). */
export function whatsappHref(text?: string): `https://${string}` {
  const base = `https://wa.me/${env.client.NEXT_PUBLIC_WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` as `https://${string}` : (base as `https://${string}`);
}

/** The 20-minute call (Cal.com link from the public env, `user/event`). */
export function bookingHref(): `https://${string}` {
  return `https://cal.com/${env.client.NEXT_PUBLIC_CAL_LINK}` as `https://${string}`;
}
