"use client";

import { usePathname } from "next/navigation";
import { useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { ChatPanelHost } from "@/components/chat/ChatPanel/ChatPanelHost";
import type { ChatRuntimeConfig } from "@/components/chat/ChatPanel/ChatSession";
import { ChatView } from "@/components/chat/ChatView/ChatView";
import { NexoBar, type NexoBarState } from "@/components/chat/NexoBar/NexoBar";
import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import type { Locale } from "@/i18n/config";
import { openChat } from "@/lib/chat/chat-events";
import type { ChatScenario } from "@/lib/chat/fixtures";
import type { NexoBarLabels } from "@/lib/chat/nexo-bar";
import { starterTopicFor } from "@/lib/chat/starters";
import { useChatFixture } from "@/lib/chat/use-chat-fixture";
import type { ChatLabels } from "@/types/chat";

import styles from "./page.module.css";

interface ChatShowcaseProps {
  locale: Locale;
  labels: ChatLabels;
  nexoBarLabels: NexoBarLabels;
  config: ChatRuntimeConfig;
  siteHostsPanel: boolean;
  scenarios: { id: ChatScenario; name: string }[];
  copy: {
    title: string;
    scenario: string;
    panel: string;
    nexoBar: {
      title: string;
      waiting: string;
      countdown: string;
      active: string;
      stopping: string;
      stopped: string;
      live: string;
    };
  };
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
const noop = () => undefined;

function LiveBar({ labels }: { labels: NexoBarLabels }) {
  const [state, setState] = useState<NexoBarState>({ kind: "active" });
  const [busy, setBusy] = useState(false);
  return (
    <NexoBar
      labels={labels}
      state={state}
      busy={busy}
      onStop={() => {
        setBusy(true);
        setTimeout(() => {
          setBusy(false);
          setState({ kind: "stopped" });
        }, 300);
      }}
      onResume={() => {
        setState({ kind: "waiting" });
      }}
    />
  );
}

export function ChatShowcase({
  locale,
  labels,
  nexoBarLabels,
  config,
  siteHostsPanel,
  scenarios,
  copy,
}: ChatShowcaseProps) {
  const client = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [scenario, setScenario] = useState<ChatScenario>("fresh");
  const [dueAt] = useState(() => new Date(Date.now() + 462_000).toISOString());
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
      <section
        className={styles.nexoBars}
        aria-labelledby="nexo-bar-demo"
        data-testid="nexo-bar-demo"
      >
        <Heading id="nexo-bar-demo" level={2} size="h3">
          {copy.nexoBar.title}
        </Heading>
        <div className={styles.barRow} data-state="waiting">
          <p className={styles.barName}>{copy.nexoBar.waiting}</p>
          <div className={styles.barFrame}>
            <NexoBar
              labels={nexoBarLabels}
              state={{ kind: "waiting" }}
              onStop={noop}
              onResume={noop}
            />
          </div>
        </div>
        <div className={styles.barRow} data-state="countdown">
          <p className={styles.barName}>{copy.nexoBar.countdown}</p>
          <div className={styles.barFrame}>
            <NexoBar
              labels={nexoBarLabels}
              state={{ kind: "countdown", dueAt }}
              onStop={noop}
              onResume={noop}
            />
          </div>
        </div>
        <div className={styles.barRow} data-state="active">
          <p className={styles.barName}>{copy.nexoBar.active}</p>
          <div className={styles.barFrame}>
            <NexoBar
              labels={nexoBarLabels}
              state={{ kind: "active" }}
              onStop={noop}
              onResume={noop}
            />
          </div>
        </div>
        <div className={styles.barRow} data-state="stopping">
          <p className={styles.barName}>{copy.nexoBar.stopping}</p>
          <div className={styles.barFrame}>
            <NexoBar
              labels={nexoBarLabels}
              state={{ kind: "active" }}
              onStop={noop}
              onResume={noop}
              busy
            />
          </div>
        </div>
        <div className={styles.barRow} data-state="stopped">
          <p className={styles.barName}>{copy.nexoBar.stopped}</p>
          <div className={styles.barFrame}>
            <NexoBar
              labels={nexoBarLabels}
              state={{ kind: "stopped" }}
              onStop={noop}
              onResume={noop}
            />
          </div>
        </div>
        <div className={styles.barRow} data-state="live">
          <p className={styles.barName}>{copy.nexoBar.live}</p>
          <div className={styles.barFrame}>
            <LiveBar labels={nexoBarLabels} />
          </div>
        </div>
      </section>
      {client && !siteHostsPanel
        ? createPortal(
            <ChatPanelHost locale={locale} labels={labels} config={config} />,
            document.body,
          )
        : null}
    </div>
  );
}
