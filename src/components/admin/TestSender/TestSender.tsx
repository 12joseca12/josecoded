"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import {
  type TestChannel,
  testChannels,
  type TestHandler,
  type TestSenderLabels,
} from "@/types/notifications";

import styles from "./TestSender.module.css";

interface TestSenderProps {
  labels: TestSenderLabels;
  telegramLinked: boolean;
  send: TestHandler;
}

type Feedback = { tone: "success" | "error"; text: string } | null;

export function TestSender({ labels, telegramLinked, send }: TestSenderProps) {
  const [busy, setBusy] = useState<TestChannel | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pending, startTransition] = useTransition();

  const run = (channel: TestChannel) => {
    if (pending) return;
    setFeedback(null);
    setBusy(channel);
    startTransition(async () => {
      const result = await send({ channel });
      if (result.status === "done") {
        setFeedback({ tone: "success", text: labels.done[channel] });
      } else if (result.status === "not_linked") {
        setFeedback({ tone: "error", text: labels.needsTelegram });
      } else {
        setFeedback({ tone: "error", text: labels.errors[result.status] });
      }
      setBusy(null);
    });
  };

  return (
    <section className={styles.test} aria-labelledby="test-title">
      <Heading level={2} size="h4" id="test-title">
        {labels.title}
      </Heading>
      <p className={styles.text}>{labels.text}</p>
      <div className={styles.actions}>
        {testChannels.map((channel) => {
          const locked = channel === "telegram" && !telegramLinked;
          return (
            <Button
              key={channel}
              type="button"
              variant="light"
              loading={busy === channel}
              loadingLabel={labels.sending}
              disabled={pending || locked}
              aria-describedby={locked ? "test-needs-telegram" : undefined}
              onClick={() => {
                run(channel);
              }}
            >
              {labels.send[channel]}
            </Button>
          );
        })}
      </div>
      {telegramLinked ? null : (
        <p id="test-needs-telegram" className={styles.hint}>
          {labels.needsTelegram}
        </p>
      )}
      <p className={styles.feedback} data-tone="success" role="status">
        {feedback?.tone === "success" ? feedback.text : null}
      </p>
      <p className={styles.feedback} data-tone="error" role="alert">
        {feedback?.tone === "error" ? feedback.text : null}
      </p>
    </section>
  );
}
