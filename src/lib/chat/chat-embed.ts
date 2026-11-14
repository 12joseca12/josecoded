import { openChat } from "./chat-events";

let focusEmbed: (() => void) | null = null;

export function registerChatEmbed(focus: () => void): () => void {
  focusEmbed = focus;
  return () => {
    if (focusEmbed === focus) focusEmbed = null;
  };
}

export const chatEmbedMounted = (): boolean => focusEmbed !== null;

export function openChatOrEmbed(): boolean {
  if (focusEmbed) {
    focusEmbed();
    return true;
  }
  return openChat();
}
