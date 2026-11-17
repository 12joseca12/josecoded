"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { openChatOrEmbed } from "./chat-embed";
import { chatFallbackHref } from "./chat-events";

export function useOpenChat(locale: string): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (!openChatOrEmbed()) router.push(chatFallbackHref(locale));
  }, [router, locale]);
}
