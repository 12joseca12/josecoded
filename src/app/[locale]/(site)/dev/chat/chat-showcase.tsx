"use client";

import { usePathname } from "next/navigation";
import { useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { ChatPanelHost } from "@/components/chat/ChatPanel/ChatPanelHost";
import { ChatView } from "@/components/chat/ChatView/ChatView";
import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import { openChat } from "@/lib/chat/chat-events";
import type { ChatScenario } from "@/lib/chat/fixtures";
import { starterTopicFor } from "@/lib/chat/starters";
import { useChatFixture } from "@/lib/chat/use-chat-fixture";
import type { ChatLabels } from "@/types/chat";

import styles from "./page.module.css";

interface ChatShowcaseProps {
  labels: ChatLabels;
  scenarios: { id: ChatScenario; name: string }[];
  copy: { title: string; scenario: string; panel: string };
}

function Scenario({ id, labels }: { id: ChatScenario; labels: ChatLabels }) {
  const titleId = useId();
  const pathname = usePathname();
  const controller = useChatFixture(id);
  return (
    <ChatView
      controller={controller}
      labels={labels}
      topic={starterTopicFor(pathname)}
      titleId={titleId}
    />
  );
}

const subscribe = () => () => undefined;

export function ChatShowcase({ labels, scenarios, copy }: ChatShowcaseProps) {
  const client = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [scenario, setScenario] = useState<ChatScenario>("fresh");
  return (
    <div className={styles.page}>
      <Heading level={1} size="h2">
        {copy.title}
      </Heading>
      <div className={styles.switcher} role="group" aria-label={copy.scenario}>
        {scenarios.map((entry) => (
          <Button
            key={entry.id}
            variant={entry.id === scenario ? "primary" : "light"}
            size="sm"
            data-scenario={entry.id}
            aria-pressed={entry.id === scenario}
            onClick={() => {
              setScenario(entry.id);
            }}
          >
            {entry.name}
          </Button>
        ))}
        <Button variant="quiet" size="sm" data-open-panel="" onClick={() => openChat()}>
          {copy.panel}
        </Button>
      </div>
      <div className={styles.frame} data-testid="preview">
        <Scenario key={scenario} id={scenario} labels={labels} />
      </div>
      {client ? createPortal(<ChatPanelHost labels={labels} />, document.body) : null}
    </div>
  );
}
