"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { chatFallbackHref, openChat } from "./chat-events";

export function useOpenChat(locale: string): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (!openChat()) router.push(chatFallbackHref(locale));
  }, [router, locale]);
}
