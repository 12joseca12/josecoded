"use client";

import { ChatIcon } from "@/components/ui/icons/ChatIcon";
import type { ChatButtonLabels } from "@/types/nav";

import styles from "./ChatButton.module.css";

interface ChatButtonProps {
  labels: ChatButtonLabels;
  onClick: () => void;
}

export function ChatButton({ labels, onClick }: ChatButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      aria-label={`${labels.label}, ${labels.online}`}
      data-chooser-trigger=""
      onClick={onClick}
    >
      <span className={styles.icon} aria-hidden="true">
        <ChatIcon />
        <span className={styles.dot} />
      </span>
      <span className={styles.label} aria-hidden="true">
        {labels.label}
      </span>
    </button>
  );
}
