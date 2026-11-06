import { Button } from "@/components/ui/Button/Button";
import type { ChatNoticeAction, ChatNoticeVariant } from "@/types/chat";

import styles from "./ChatNotice.module.css";

interface ChatNoticeProps {
  variant: ChatNoticeVariant;
  title: string;
  text: string;
  action?: ChatNoticeAction;
}

export function ChatNotice({ variant, title, text, action }: ChatNoticeProps) {
  return (
    <div className={styles.notice} data-variant={variant} role="status">
      <p className={styles.title}>{title}</p>
      <p className={styles.text}>{text}</p>
      {action ? (
        <Button href={action.href} variant="light" size="sm">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
