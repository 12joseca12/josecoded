"use client";

import { type RefObject, useCallback, useEffect, useRef } from "react";

import type { ContactClientConfig } from "@/lib/contact/env";
import { loadTurnstile } from "@/lib/contact/turnstile-client";

export const chatTurnstileAction = "chat";
const tokenTimeoutMs = 20_000;

export interface ChatTurnstile {
  container: RefObject<HTMLDivElement | null>;
  request: () => Promise<string | null>;
}

export function useChatTurnstile(
  config: ContactClientConfig | null,
  locale: string,
): ChatTurnstile {
  const container = useRef<HTMLDivElement | null>(null);
  const widget = useRef<string | null>(null);
  const ready = useRef<string | null>(null);
  const waiting = useRef<((token: string | null) => void) | null>(null);
  const used = useRef(false);

  useEffect(
    () => () => {
      if (widget.current !== null) window.turnstile?.remove(widget.current);
      widget.current = null;
    },
    [],
  );

  const request = useCallback(async (): Promise<string | null> => {
    const node = container.current;
    if (!config || !node) return null;
    let api: TurnstileApi;
    try {
      api = await loadTurnstile(config.scriptUrl);
    } catch {
      return null;
    }
    const settle = (token: string | null) => {
      const resolve = waiting.current;
      waiting.current = null;
      if (resolve) resolve(token);
      else ready.current = token;
    };
    widget.current ??= api.render(node, {
      sitekey: config.siteKey,
      action: chatTurnstileAction,
      language: locale,
      theme: "light",
      size: "normal",
      execution: "execute",
      appearance: "interaction-only",
      callback: settle,
      "error-callback": () => {
        settle(null);
      },
      "expired-callback": () => {
        ready.current = null;
      },
      "before-interactive-callback": () => {
        node.dataset.interactive = "";
      },
      "after-interactive-callback": () => {
        delete node.dataset.interactive;
      },
    });
    const id = widget.current;
    const waited = ready.current;
    if (waited !== null) {
      ready.current = null;
      used.current = true;
      return waited;
    }
    return new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => {
        waiting.current = null;
        resolve(null);
      }, tokenTimeoutMs);
      waiting.current = (token) => {
        clearTimeout(timer);
        resolve(token);
      };
      if (used.current) api.reset(id);
      used.current = true;
      api.execute(id);
    });
  }, [config, locale]);

  return { container, request };
}
