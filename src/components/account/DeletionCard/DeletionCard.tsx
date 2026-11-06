"use client";

import { useState, useTransition } from "react";

import { requestDeletion, withdrawDeletion } from "@/app/[locale]/(private)/cuenta/actions";
import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import { fill } from "@/lib/notifications/time";
import { formatMadridStamp } from "@/lib/settings/madrid-time";
import type { DeletionLabels } from "@/types/account";

import { AccountFeedback, type FeedbackState } from "../AccountFeedback/AccountFeedback";
import { ConfirmAction } from "../ConfirmAction/ConfirmAction";
import styles from "./DeletionCard.module.css";

interface DeletionCardProps {
  locale: string;
  requestedAt: string | null;
  labels: DeletionLabels;
}

export function DeletionCard({ locale, requestedAt, labels }: DeletionCardProps) {
  const [current, setCurrent] = useState(requestedAt);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pending, startTransition] = useTransition();

  const onRequest = async () => {
    setFeedback(null);
    const result = await requestDeletion(locale);
    if (result.status === "done") {
      setCurrent(result.requestedAt);
      setFeedback({ tone: "success", text: labels.done });
    } else {
      setFeedback({ tone: "error", text: labels.errors[result.code] });
    }
  };

  const onWithdraw = () => {
    if (pending) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await withdrawDeletion(locale);
      if (result.status === "done") {
        setCurrent(null);
        setFeedback({ tone: "success", text: labels.withdrawn });
      } else {
        setFeedback({ tone: "error", text: labels.errors[result.code] });
      }
    });
  };

  return (
    <div className={styles.card}>
      <Heading level={3} size="h4">
        {labels.title}
      </Heading>
      <p className={styles.lead}>{labels.lead}</p>
      {current === null ? (
        <ConfirmAction
          trigger={labels.request}
          loadingLabel={labels.requestLoading}
          labels={labels.confirm}
          run={onRequest}
        />
      ) : (
        <div className={styles.pending} role="group" aria-label={labels.pendingTitle}>
          <p className={styles.pendingTitle}>{labels.pendingTitle}</p>
          <p>{fill(labels.pendingText, { date: formatMadridStamp(current, locale) })}</p>
          <div>
            <Button
              type="button"
              variant="light"
              loading={pending}
              loadingLabel={labels.withdrawLoading}
              onClick={onWithdraw}
            >
              {labels.withdraw}
            </Button>
          </div>
        </div>
      )}
      <AccountFeedback feedback={feedback} />
    </div>
  );
}
