import { createSignal } from "@/lib/events/signal";

const chatSignal = createSignal();
const openSignal = createSignal();
const closeSignal = createSignal();
const openMark = "data-chat-open";
let chatOpen = false;

export const openChat = chatSignal.emit;
export const onOpenChat = chatSignal.subscribe;
export const closeChat = closeSignal.emit;
export const onCloseChat = closeSignal.subscribe;
export const chatPanelMounted = chatSignal.hasListeners;

export function setChatOpen(open: boolean): void {
  if (open === chatOpen) return;
  chatOpen = open;
  document.documentElement.toggleAttribute(openMark, open);
  openSignal.emit();
}

export const isChatOpen = (): boolean => chatOpen;
export const onChatOpenChange = openSignal.subscribe;

export function chatFallbackHref(locale: string): string {
  return `/${locale}/contacto#chat`;
}
