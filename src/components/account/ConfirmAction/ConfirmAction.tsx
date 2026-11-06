"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import type { ConfirmLabels } from "@/types/account";
import type { ButtonVariant } from "@/types/ui";

import styles from "./ConfirmAction.module.css";

interface ConfirmActionProps {
  trigger: string;
  loadingLabel: string;
  labels: ConfirmLabels;
  run: () => Promise<void>;
  variant?: ButtonVariant;
}

export function ConfirmAction({
  trigger,
  loadingLabel,
  labels,
  run,
  variant = "light",
}: ConfirmActionProps) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();
  const group = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLDivElement>(null);
  const wasAsking = useRef(false);

  useEffect(() => {
    if (asking) group.current?.querySelector<HTMLElement>("button")?.focus();
    else if (wasAsking.current) opener.current?.querySelector<HTMLElement>("button")?.focus();
    wasAsking.current = asking;
  }, [asking]);

  const onYes = () => {
    if (pending) return;
    startTransition(async () => {
      await run();
      setAsking(false);
    });
  };

  if (!asking) {
    return (
      <div ref={opener}>
        <Button
          type="button"
          variant={variant}
          onClick={() => {
            setAsking(true);
          }}
        >
          {trigger}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.confirm} role="group" aria-label={labels.question} ref={group}>
      <p className={styles.question}>{labels.question}</p>
      <div className={styles.answers}>
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={pending}
          loadingLabel={loadingLabel}
          onClick={onYes}
        >
          {labels.yes}
        </Button>
        <Button
          type="button"
          variant="quiet"
          size="sm"
          disabled={pending}
          onClick={() => {
            setAsking(false);
          }}
        >
          {labels.no}
        </Button>
      </div>
    </div>
  );
}
