"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import { telegramStartUrl } from "@/lib/notifications/config";
import { fill, formatMadridTime } from "@/lib/notifications/time";
import { formatMadridStamp } from "@/lib/settings/madrid-time";
import type {
  NotificationFailure,
  TelegramCodeHandler,
  TelegramLinkLabels,
  TelegramStatus,
  TelegramUnlinkHandler,
} from "@/types/notifications";

import styles from "./TelegramLinkCard.module.css";

interface TelegramLinkCardProps {
  status: TelegramStatus;
  botUsername: string | null;
  labels: TelegramLinkLabels;
  locale: string;
  generate: TelegramCodeHandler;
  unlink: TelegramUnlinkHandler;
}

type Feedback = { tone: "success" | "info" | "error"; text: string } | null;

function signatureOf(status: TelegramStatus): string {
  return `${status.linkedAt ?? ""}|${status.code ?? ""}`;
}

function describe(failure: NotificationFailure, labels: TelegramLinkLabels): Feedback {
  return { tone: "error", text: labels.errors[failure] };
}

export function TelegramLinkCard({
  status,
  botUsername,
  labels,
  locale,
  generate,
  unlink,
}: TelegramLinkCardProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [seen, setSeen] = useState(signatureOf(status));
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState<"generate" | "check" | "unlink" | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const wasAsking = useRef(false);

  const signature = signatureOf(status);
  if (seen !== signature) {
    setSeen(signature);
    setCurrent(status);
    setAsking(false);
    if (status.linkedAt !== null && current.linkedAt === null) {
      setFeedback({ tone: "success", text: labels.done.linked });
    }
  }

  useEffect(() => {
    if (asking) confirmRef.current?.querySelector<HTMLElement>("button")?.focus();
    else if (wasAsking.current) triggerRef.current?.querySelector<HTMLElement>("button")?.focus();
    wasAsking.current = asking;
  }, [asking]);

  const linked = current.linkedAt !== null;
  const hasCode = !linked && current.code !== null;
  const startUrl =
    hasCode && botUsername ? telegramStartUrl(botUsername, current.code ?? "") : null;
  const expires = current.expiresAt ? formatMadridTime(current.expiresAt, locale) : null;

  const onGenerate = () => {
    if (pending) return;
    setFeedback(null);
    setBusy("generate");
    startTransition(async () => {
      const result = await generate();
      if (result.status === "done") {
        setCurrent({ linkedAt: null, code: result.code, expiresAt: result.expiresAt });
      } else {
        setFeedback(describe(result.status, labels));
      }
      setBusy(null);
    });
  };

  const onCheck = () => {
    if (pending) return;
    setFeedback({ tone: "info", text: labels.stillPending });
    setBusy("check");
    startTransition(() => {
      router.refresh();
      setBusy(null);
    });
  };

  const onUnlink = () => {
    if (pending) return;
    setFeedback(null);
    setBusy("unlink");
    startTransition(async () => {
      const result = await unlink();
      if (result.status === "done") {
        setCurrent({ linkedAt: null, code: null, expiresAt: null });
        setAsking(false);
        setFeedback({ tone: "success", text: labels.done.unlinked });
      } else {
        setFeedback(describe(result.status, labels));
      }
      setBusy(null);
    });
  };

  return (
    <section className={styles.card} aria-labelledby="telegram-title" data-linked={linked}>
      <header className={styles.head}>
        <Heading level={2} size="h4" id="telegram-title">
          {labels.title}
        </Heading>
        <p className={styles.state}>
          <span className={styles.dot} aria-hidden="true" />
          {linked && current.linkedAt
            ? fill(labels.linked, { date: formatMadridStamp(current.linkedAt, locale) })
            : labels.unlinked}
        </p>
      </header>
      <p className={styles.text}>{labels.text}</p>
      {botUsername === null && !linked ? (
        <div className={styles.band} role="note">
          <p className={styles.bandTitle}>{labels.noBot.title}</p>
          <p>{labels.noBot.text}</p>
        </div>
      ) : null}
      {hasCode ? (
        <div className={styles.code} role="group" aria-labelledby="telegram-code-title">
          <p id="telegram-code-title" className={styles.codeTitle}>
            {labels.codeTitle}
          </p>
          <p className={styles.value} translate="no">
            {current.code}
          </p>
          {expires ? (
            <p className={styles.help}>{fill(labels.codeHelp, { time: expires })}</p>
          ) : null}
        </div>
      ) : null}
      <div className={styles.actions} ref={triggerRef}>
        {!linked && !hasCode && botUsername !== null ? (
          <Button
            type="button"
            variant="accent"
            loading={busy === "generate"}
            loadingLabel={labels.generating}
            disabled={pending}
            onClick={onGenerate}
          >
            {labels.generate}
          </Button>
        ) : null}
        {hasCode && startUrl ? (
          <Button href={startUrl} variant="accent" target="_blank" rel="noopener noreferrer">
            {labels.open}
          </Button>
        ) : null}
        {hasCode ? (
          <Button
            type="button"
            variant="light"
            loading={busy === "check"}
            loadingLabel={labels.checking}
            disabled={pending}
            onClick={onCheck}
          >
            {labels.check}
          </Button>
        ) : null}
        {linked && !asking ? (
          <Button
            type="button"
            variant="light"
            disabled={pending}
            onClick={() => {
              setFeedback(null);
              setAsking(true);
            }}
          >
            {labels.unlink}
          </Button>
        ) : null}
      </div>
      {linked && asking ? (
        <div
          className={styles.confirm}
          role="group"
          aria-label={labels.confirmUnlink}
          ref={confirmRef}
        >
          <p className={styles.question}>{labels.confirmUnlink}</p>
          <div className={styles.answers}>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={busy === "unlink"}
              loadingLabel={labels.unlinking}
              onClick={onUnlink}
            >
              {labels.confirmYes}
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
              {labels.confirmNo}
            </Button>
          </div>
        </div>
      ) : null}
      <p className={styles.feedback} data-tone="success" role="status">
        {feedback && feedback.tone !== "error" ? feedback.text : null}
      </p>
      <p className={styles.feedback} data-tone="error" role="alert">
        {feedback?.tone === "error" ? feedback.text : null}
      </p>
    </section>
  );
}
