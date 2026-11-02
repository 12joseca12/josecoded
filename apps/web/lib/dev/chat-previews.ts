/** The states of `/dev/chat/<state>` (block B02): the four things the chat screen can be in. */
export const CHAT_STATES = ['vacio', 'conversacion', 'cuota', 'jose'] as const;
export type ChatState = (typeof CHAT_STATES)[number];

export function findChatState(state: string): ChatState | null {
  return CHAT_STATES.find((id) => id === state) ?? null;
}
