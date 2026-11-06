"use client";

import { Button } from "@/components/ui/Button/Button";
import { ChatIcon } from "@/components/ui/icons/ChatIcon";
import { useOpenChat } from "@/lib/chat/use-open-chat";

import styles from "./ChatInvite.module.css";

interface ChatInviteProps {
  locale: string;
  label: string;
  hint: string;
  variant?: "invite" | "action";
}

export function ChatInvite({ locale, label, hint, variant = "invite" }: ChatInviteProps) {
  const open = useOpenChat(locale);
  return (
    <div className={styles.invite} data-variant={variant}>
      <Button
        variant={variant === "action" ? "light" : "quiet"}
        size="sm"
        icon={<ChatIcon />}
        iconStart
        onClick={open}
      >
        {label}
      </Button>
      {variant === "invite" ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
