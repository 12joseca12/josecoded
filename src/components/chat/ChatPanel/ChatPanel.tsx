"use client";

import NextLink from "next/link";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/ui/IconButton/IconButton";
import type { Locale } from "@/i18n/config";
import { setChatOpen } from "@/lib/chat/chat-events";
import type { ChatLabels } from "@/types/chat";

import styles from "./ChatPanel.module.css";
import { type ChatRuntimeConfig, ChatSession } from "./ChatSession";
import { isSheetLayout, useSheetDrag } from "./use-sheet-drag";

const tabbableSelector =
  "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type='hidden']), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

function keepFocusInside(node: HTMLDialogElement, backwards: boolean): boolean {
  const tabbable = [...node.querySelectorAll<HTMLElement>(tabbableSelector)].filter((element) =>
    element.checkVisibility({ visibilityProperty: true }),
  );
  const first = tabbable.at(0);
  const last = tabbable.at(-1);
  if (!first || !last) return false;
  const active = document.activeElement;
  const edge = backwards ? first : last;
  if (active !== edge && node.contains(active)) return false;
  (backwards ? last : first).focus();
  return true;
}

async function settleEntrance(node: HTMLElement): Promise<void> {
  const entrance = node
    .getAnimations({ subtree: true })
    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
  await Promise.allSettled(entrance.map((animation) => animation.finished));
}

interface ChatPanelProps {
  locale: Locale;
  labels: ChatLabels;
  config: ChatRuntimeConfig;
  openRequest: number;
  openerRef: RefObject<HTMLElement | null>;
}

export function ChatPanel({ locale, labels, config, openRequest, openerRef }: ChatPanelProps) {
  const [closedAt, setClosedAt] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const entrance = useRef(0);

  const closeDialog = useCallback(() => {
    const node = dialog.current;
    if (node?.open) node.close();
  }, []);
  const { handlers: dragHandlers, reset: resetDrag } = useSheetDrag(dialog, closeDialog);
  const close = useCallback(() => {
    resetDrag();
    closeDialog();
  }, [resetDrag, closeDialog]);

  useEffect(() => {
    const node = dialog.current;
    if (!node || openRequest === 0) return;
    if (!node.open) {
      const current = ++entrance.current;
      node.setAttribute("data-entering", "");
      node.querySelectorAll('[role="log"] > ul > li').forEach((item) => {
        item.setAttribute("data-stagger", "");
      });
      if (isSheetLayout()) node.showModal();
      else node.show();
      void settleEntrance(node).then(() => {
        if (entrance.current === current) node.removeAttribute("data-entering");
      });
    }
    if (node.open) setChatOpen(true);
    input.current?.focus({ preventScroll: true });
  }, [openRequest]);

  useEffect(
    () => () => {
      setChatOpen(false);
    },
    [],
  );

  return (
    <dialog
      ref={dialog}
      className={styles.panel}
      aria-label={labels.title}
      onClose={() => {
        entrance.current += 1;
        dialog.current?.removeAttribute("data-entering");
        setChatOpen(false);
        setClosedAt(openRequest);
        const target = openerRef.current;
        openerRef.current = null;
        if (target?.isConnected) target.focus({ preventScroll: true });
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
        if (
          event.key === "Tab" &&
          event.currentTarget.matches(":modal") &&
          keepFocusInside(event.currentTarget, event.shiftKey)
        ) {
          event.preventDefault();
        }
      }}
      onClick={(event) => {
        const node = event.currentTarget;
        if (event.target !== node || !node.matches(":modal")) return;
        if (event.clientY < node.getBoundingClientRect().top) close();
      }}
      {...dragHandlers}
    >
      <div className={styles.grab} data-sheet-handle="" aria-hidden="true">
        <span />
      </div>
      <div className={styles.body}>
        <ChatSession
          locale={locale}
          labels={labels}
          config={config}
          active={openRequest > closedAt}
          inputRef={input}
          actions={
            <>
              <NextLink
                href={labels.fullscreenHref}
                className={styles.fullscreen}
                aria-label={labels.fullscreen}
                onClick={close}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <path d="M11.5 3.5h5v5M16.5 3.5l-6 6M8.5 16.5h-5v-5M3.5 16.5l6-6" />
                </svg>
              </NextLink>
              <IconButton label={labels.close} onClick={close}>
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </IconButton>
            </>
          }
        />
      </div>
    </dialog>
  );
}
