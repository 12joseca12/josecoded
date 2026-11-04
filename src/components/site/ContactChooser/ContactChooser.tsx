"use client";

import { type KeyboardEvent, useEffect, useRef } from "react";

import { Button } from "@/components/ui/Button/Button";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { ChatIcon } from "@/components/ui/icons/ChatIcon";
import { ChevronIcon } from "@/components/ui/icons/ChevronIcon";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import type { ContactChooserLabels } from "@/types/nav";

import styles from "./ContactChooser.module.css";

export type ChooserFocus = "first" | "chat";

interface ContactChooserProps {
  id: string;
  open: boolean;
  focus: ChooserFocus;
  onOpen: (focus: ChooserFocus) => void;
  onClose: () => void;
  triggerLabel: string;
  labels: ContactChooserLabels;
  whatsappHref: string | null;
  onChat: () => void;
}

const popoverQuery = "(min-width: 64rem)";
const triggerSelector = "[data-chooser-trigger]";
const optionSelector = "[data-option]";

export function ContactChooser({
  id,
  open,
  focus,
  onOpen,
  onClose,
  triggerLabel,
  labels,
  whatsappHref,
  onChat,
}: ContactChooserProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = `${id}-title`;

  const restoreFocus = () => {
    const opener = openerRef.current;
    const fallback = anchorRef.current?.querySelector<HTMLElement>(triggerSelector);
    (opener?.isConnected ? opener : fallback)?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) {
      const sheet = !window.matchMedia(popoverQuery).matches;
      dialog.dataset.mode = sheet ? "sheet" : "popover";
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (sheet) dialog.showModal();
      else dialog.show();
    }
    const options = dialog.querySelectorAll<HTMLElement>(optionSelector);
    const wanted =
      focus === "chat" ? dialog.querySelector<HTMLElement>('[data-option="chat"]') : options[0];
    wanted?.focus({ preventScroll: true });
  }, [open, focus]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const onPointerDown = (event: PointerEvent) => {
      if (dialog?.dataset.mode !== "popover") return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (dialog.contains(target) || target.closest(triggerSelector)) return;
      onClose();
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || dialog?.dataset.mode !== "popover") return;
      onClose();
      restoreFocus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const moveFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const options = [...event.currentTarget.querySelectorAll<HTMLElement>(optionSelector)];
    if (options.length === 0) return;
    event.preventDefault();
    const index = options.indexOf(document.activeElement as HTMLElement);
    const last = options.length - 1;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? last
          : event.key === "ArrowDown"
            ? (index + 1) % options.length
            : index <= 0
              ? last
              : index - 1;
    options[next]?.focus();
  };

  const afterClose = () => {
    onClose();
    const active = document.activeElement;
    if (active === document.body || dialogRef.current?.contains(active)) restoreFocus();
  };

  return (
    <div className={styles.anchor} ref={anchorRef} data-open={open || undefined}>
      <Button
        size="sm"
        icon={<ChevronIcon />}
        aria-expanded={open}
        aria-controls={id}
        data-chooser-trigger=""
        onClick={() => {
          if (open) onClose();
          else onOpen("first");
        }}
      >
        {triggerLabel}
      </Button>
      <dialog
        ref={dialogRef}
        id={id}
        className={styles.panel}
        aria-labelledby={titleId}
        onClose={afterClose}
        onKeyDown={moveFocus}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className={styles.inner}>
          <div className={styles.head}>
            <p className={styles.title} id={titleId}>
              {labels.title}
            </p>
            <span className={styles.close}>
              <IconButton label={labels.close} onClick={onClose}>
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </IconButton>
            </span>
          </div>
          <ul className={styles.options}>
            {whatsappHref ? (
              <li>
                <a
                  className={styles.option}
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-option="whatsapp"
                  onClick={onClose}
                >
                  <span className={styles.optionIcon}>
                    <WhatsAppIcon />
                  </span>
                  <span className={styles.optionText}>
                    <span className={styles.optionTitle}>{labels.whatsapp}</span>
                    <span className={styles.optionHint}>{labels.whatsappHint}</span>
                  </span>
                </a>
              </li>
            ) : null}
            <li>
              <button
                type="button"
                className={styles.option}
                data-option="chat"
                onClick={() => {
                  onClose();
                  onChat();
                }}
              >
                <span className={styles.optionIcon}>
                  <ChatIcon />
                </span>
                <span className={styles.optionText}>
                  <span className={styles.optionTitle}>{labels.chat}</span>
                  <span className={styles.optionHint}>{labels.chatHint}</span>
                </span>
              </button>
            </li>
          </ul>
        </div>
      </dialog>
    </div>
  );
}
