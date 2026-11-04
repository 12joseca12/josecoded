import { createSignal } from "@/lib/events/signal";

const chatSignal = createSignal();

export const openChat = chatSignal.emit;
export const onOpenChat = chatSignal.subscribe;
export const chatPanelMounted = chatSignal.hasListeners;

export function chatFallbackHref(locale: string): string {
  return `/${locale}/contacto#chat`;
}
