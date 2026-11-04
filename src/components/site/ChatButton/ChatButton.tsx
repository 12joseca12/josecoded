"use client";

import { Button } from "@/components/ui/Button/Button";
import { ChatIcon } from "@/components/ui/icons/ChatIcon";
import type { ChatButtonLabels } from "@/types/nav";

interface ChatButtonProps {
  labels: ChatButtonLabels;
  onClick: (opener: HTMLElement) => void;
}

export function ChatButton({ labels, onClick }: ChatButtonProps) {
  return (
    <Button
      variant="light"
      size="sm"
      icon={<ChatIcon />}
      iconStart
      badge
      collapse
      data-chooser-trigger=""
      onClick={(event) => {
        onClick(event.currentTarget);
      }}
    >
      {labels.label}
    </Button>
  );
}
