"use client";

import { type ReactNode, type Ref, useEffect, useState } from "react";

import { visitorNexoState } from "@/lib/chat/visitor-state";
import type { ChatController, ChatLabels, ChatMessage, ChatStarterTopic } from "@/types/chat";

import { ChatComposer, type PlainSend } from "../ChatComposer/ChatComposer";
import { ChatNotice } from "../ChatNotice/ChatNotice";
import { ChatThread } from "../ChatThread/ChatThread";
import { HandoffCard } from "../HandoffCard/HandoffCard";
import { NexoAvatar } from "../NexoFaqChat/NexoAvatar";
import { Starters } from "../Starters/Starters";
import styles from "./ChatView.module.css";

interface ChatViewProps {
  controller: ChatController;
  labels: ChatLabels;
  topic: ChatStarterTopic;
  actions?: ReactNode;
  titleId: string;
  titleLevel?: 1 | 2;
  inputRef?: Ref<HTMLTextAreaElement>;
  plainAction?: PlainSend;
}

const minSpeakingMs = 1200;
const maxSpeakingMs = 3200;

function speakingMs(text: string): number {
  return Math.min(maxSpeakingMs, Math.max(minSpeakingMs, 900 + text.length * 14));
}

function useSpeaking(messages: readonly ChatMessage[]): boolean {
  const last = messages.at(-1);
  const [seen, setSeen] = useState<string | null>(last?.id ?? null);
  const [speaking, setSpeaking] = useState(false);
  if ((last?.id ?? null) !== seen) {
    setSeen(last?.id ?? null);
    setSpeaking(last?.variant === "nexo");
  }
  const length = last?.body.length ?? 0;
  useEffect(() => {
    if (!speaking) return;
    const timer = setTimeout(
      () => {
        setSpeaking(false);
      },
      speakingMs("x".repeat(length)),
    );
    return () => {
      clearTimeout(timer);
    };
  }, [speaking, seen, length]);
  return speaking;
}

export function ChatView({
  controller,
  labels,
  topic,
  actions,
  titleId,
  titleLevel = 2,
  inputRef,
  plainAction,
}: ChatViewProps) {
  const { messages, status, handoff, sending, sendError } = controller;
  const [drafting, setDrafting] = useState(false);
  const speaking = useSpeaking(messages);
  const Title = titleLevel === 1 ? "h1" : "h2";
  const talking = status.aiEnabled && status.nexoOnline;
  const hasVisitorMessage = messages.some((message) => message.variant === "visitor");
  const state = visitorNexoState({
    status,
    drafting,
    sending,
    speaking,
    failed: sendError !== null,
    fresh: messages.length === 0,
    leadSaved: handoff.phase === "done" && messages.at(-1)?.systemEvent === "handoff_done",
  });
  const avatarLabel = !status.nexoOnline ? labels.avatar.offline : labels.avatar.states[state];
  const subtitle = !status.aiEnabled
    ? labels.subtitleTakeover
    : status.nexoOnline
      ? labels.subtitleOnline
      : labels.subtitleOffline;
  const greeting: ChatMessage | null = talking || messages.length === 0 ? greetingOf(labels) : null;
  const notice = status.quotaExceeded
    ? "quota"
    : !status.aiEnabled
      ? "takeover"
      : !status.nexoOnline
        ? "offline"
        : null;

  return (
    <div className={styles.view}>
      <div className={styles.head}>
        <NexoAvatar state={state} label={avatarLabel} />
        <div className={styles.intro}>
          <Title id={titleId} className={styles.title}>
            {labels.title}
          </Title>
          <p className={styles.subtitle} data-online={talking || undefined}>
            {subtitle}
          </p>
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      {notice ? (
        <ChatNotice
          variant={notice}
          title={labels.notices[notice].title}
          text={labels.notices[notice].text}
          action={notice === "quota" ? labels.quotaAction : undefined}
        />
      ) : null}
      <ChatThread
        messages={messages}
        greeting={greeting}
        labels={labels}
        typing={talking && (status.pendingReply || sending) && !speaking}
      >
        {handoff.phase === "hidden" ? null : (
          <HandoffCard
            headingLevel={titleLevel === 1 ? 2 : 3}
            labels={labels.handoff}
            state={handoff}
            onSubmit={controller.submitHandoff}
          />
        )}
      </ChatThread>
      {sendError ? (
        <p className={styles.error} role="alert">
          {labels.sendErrors[sendError]}
        </p>
      ) : null}
      {hasVisitorMessage || status.quotaExceeded ? null : (
        <Starters
          label={labels.startersLabel}
          items={labels.starters[topic]}
          disabled={sending}
          onPick={(text) => {
            void controller.send(text);
          }}
        />
      )}
      <ChatComposer
        labels={labels}
        sending={sending}
        disabled={status.quotaExceeded}
        onSend={controller.send}
        onDraftingChange={setDrafting}
        inputRef={inputRef}
        plainAction={plainAction}
      />
    </div>
  );
}

function greetingOf(labels: ChatLabels): ChatMessage {
  return {
    id: "greeting",
    variant: "nexo",
    body: labels.greeting,
    authorName: null,
    sources: [],
    createdAt: "",
    systemEvent: null,
    delivery: "sent",
  };
}
