"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import type { RoomActionResult } from "@/types/room";

import styles from "./NexoConsentCard.module.css";

export type ConsentChoice = "granted" | "revoked" | "pending";

export interface NexoConsentLabels {
  title: string;
  text: string;
  state: Record<ConsentChoice, string>;
  grant: string;
  revoke: string;
  saving: string;
  done: { granted: string; revoked: string };
  errors: { forbidden: string; error: string };
}

interface NexoConsentCardProps {
  initial: ConsentChoice;
  labels: NexoConsentLabels;
  setConsent: (granted: boolean) => Promise<RoomActionResult>;
}

export function NexoConsentCard({ initial, labels, setConsent }: NexoConsentCardProps) {
  const [state, setState] = useState<ConsentChoice>(initial);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [saving, startSaving] = useTransition();

  const granted = state === "granted";

  const onClick = () => {
    const next = !granted;
    setMessage("");
    setFailed(false);
    startSaving(async () => {
      const result = await setConsent(next);
      if (result.status === "done") {
        setState(next ? "granted" : "revoked");
        setMessage(next ? labels.done.granted : labels.done.revoked);
        return;
      }
      setFailed(true);
      setMessage(result.code === "forbidden" ? labels.errors.forbidden : labels.errors.error);
    });
  };

  return (
    <section className={styles.card} aria-labelledby="area-nexo-consent" data-state={state}>
      <Heading level={2} size="h4" id="area-nexo-consent">
        {labels.title}
      </Heading>
      <p className={styles.text}>{labels.text}</p>
      <p className={styles.state}>{labels.state[state]}</p>
      <Button
        variant="light"
        size="sm"
        loading={saving}
        loadingLabel={labels.saving}
        onClick={onClick}
      >
        {granted ? labels.revoke : labels.grant}
      </Button>
      <p className={styles.status} role="status" data-failed={failed || undefined}>
        {message}
      </p>
    </section>
  );
}
