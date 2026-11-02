"use client";

import { useState } from "react";

import type { HeadingLevel } from "@/types/ui";

import { Button } from "../Button/Button";
import { Heading } from "../Heading/Heading";
import styles from "./ErrorState.module.css";

export interface ErrorStateProps {
  title: string;
  text: string;
  retryLabel: string;
  loadingLabel: string;
  onRetry: () => Promise<void> | void;
  headingLevel?: HeadingLevel;
}

export function ErrorState({
  title,
  text,
  retryLabel,
  loadingLabel,
  onRetry,
  headingLevel = 3,
}: ErrorStateProps) {
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className={styles.state} role="alert">
      <Heading level={headingLevel} size="h4">
        {title}
      </Heading>
      <p className={styles.text}>{text}</p>
      <Button
        variant="primary"
        size="sm"
        loading={retrying}
        loadingLabel={loadingLabel}
        onClick={() => {
          void retry();
        }}
      >
        {retryLabel}
      </Button>
    </div>
  );
}
