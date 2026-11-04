"use client";

import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/Button/Button";
import { ChatIcon } from "@/components/ui/icons/ChatIcon";
import { chatPanelMounted, openChat } from "@/lib/chat/chat-events";

import { ChannelCard } from "../ChannelCard/ChannelCard";
import styles from "./ChatChannel.module.css";

interface ChatChannelProps {
  title: string;
  hint: string;
  openLabel: string;
  soonLabel: string;
}

const staticSubscribe = () => () => undefined;
const serverSnapshot = () => false;

export function ChatChannel({ title, hint, openLabel, soonLabel }: ChatChannelProps) {
  const available = useSyncExternalStore(staticSubscribe, chatPanelMounted, serverSnapshot);
  return (
    <ChannelCard id="chat" title={title} hint={hint}>
      {available ? (
        <Button
          icon={<ChatIcon />}
          onClick={() => {
            openChat();
          }}
        >
          {openLabel}
        </Button>
      ) : (
        <p className={styles.soon} role="status">
          {soonLabel}
        </p>
      )}
    </ChannelCard>
  );
}
