"use client";

import Image from "next/image";
import { type SyntheticEvent, useRef, useState, useTransition } from "react";

import { finishTotpChange, startTotpChange } from "@/app/[locale]/(private)/cuenta/actions";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import type { TotpManageLabels } from "@/types/account";
import { otpLength, otpPattern } from "@/types/auth";

import { AccountCard } from "../AccountCard/AccountCard";
import { AccountFeedback, type FeedbackState } from "../AccountFeedback/AccountFeedback";
import styles from "./TotpManage.module.css";

interface TotpManageProps {
  locale: string;
  enrolled: boolean;
  labels: TotpManageLabels;
}

interface Pairing {
  factorId: string;
  qrCode: string;
  secret: string;
}

const qrSize = 192;

export function TotpManage({ locale, enrolled, labels }: TotpManageProps) {
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [busy, setBusy] = useState<"start" | "confirm" | null>(null);
  const [, startTransition] = useTransition();
  const [codeError, setCodeError] = useState<string | undefined>();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const form = useRef<HTMLFormElement>(null);

  const fail = (text: string) => {
    setFeedback({ tone: "error", text });
  };

  const onStart = () => {
    if (busy) return;
    setFeedback(null);
    setBusy("start");
    startTransition(async () => {
      const result = await startTotpChange(locale);
      if (result.status === "ready") {
        setPairing({ factorId: result.factorId, qrCode: result.qrCode, secret: result.secret });
      } else {
        fail(result.status === "rate_limited" ? labels.rateLimited : labels.failed);
      }
      setBusy(null);
    });
  };

  const onConfirm = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || pairing === null) return;
    const entry = new FormData(event.currentTarget).get("code");
    const code = typeof entry === "string" ? entry.trim() : "";
    setFeedback(null);
    if (!otpPattern.test(code)) {
      setCodeError(labels.errors.code_invalid);
      form.current?.querySelector<HTMLElement>('[name="code"]')?.focus();
      return;
    }
    setCodeError(undefined);
    setBusy("confirm");
    startTransition(async () => {
      const result = await finishTotpChange(locale, { factorId: pairing.factorId, code });
      if (result.status === "done") {
        setPairing(null);
        setFeedback({ tone: "success", text: labels.done });
      } else if (result.status === "invalid") {
        setCodeError(labels.errors[result.error]);
      } else if (result.status === "wrong_code") {
        fail(labels.wrongCode);
      } else if (result.status === "rate_limited") {
        fail(labels.rateLimited);
      } else {
        fail(labels.failed);
      }
      setBusy(null);
    });
  };

  return (
    <AccountCard id="security" title={labels.title} lead={labels.lead}>
      <p className={styles.state} data-on={enrolled}>
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.stateLabel}>{labels.status}</span>
        {enrolled ? labels.statusOn : labels.statusOff}
      </p>
      {pairing === null ? (
        <div className={styles.actions}>
          {enrolled ? (
            <Button
              type="button"
              variant="light"
              loading={busy === "start"}
              loadingLabel={labels.starting}
              onClick={onStart}
            >
              {labels.change}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className={styles.pairing}>
          <section className={styles.scan} aria-labelledby="totp-change-scan">
            <p id="totp-change-scan" className={styles.scanLabel}>
              {labels.scanLabel}
            </p>
            <Image
              className={styles.qr}
              src={pairing.qrCode}
              alt={labels.qrAlt}
              width={qrSize}
              height={qrSize}
              unoptimized
            />
            <div className={styles.secret}>
              <p className={styles.secretLabel}>{labels.secretLabel}</p>
              <code className={styles.secretValue} translate="no">
                {pairing.secret}
              </code>
            </div>
          </section>
          <form
            ref={form}
            className={styles.form}
            noValidate
            onSubmit={onConfirm}
            onInput={() => {
              setCodeError(undefined);
            }}
          >
            <Field
              name="code"
              label={labels.codeLabel}
              hint={labels.codeHint}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={otpLength}
              pattern="[0-9]*"
              spellCheck={false}
              required
              error={codeError}
            />
            <AccountFeedback feedback={feedback} />
            <div className={styles.actions}>
              <Button type="submit" loading={busy === "confirm"} loadingLabel={labels.confirming}>
                {labels.confirm}
              </Button>
              <Button
                type="button"
                variant="quiet"
                disabled={busy !== null}
                onClick={() => {
                  setPairing(null);
                  setCodeError(undefined);
                  setFeedback(null);
                }}
              >
                {labels.cancel}
              </Button>
            </div>
          </form>
        </div>
      )}
      {pairing === null ? <AccountFeedback feedback={feedback} /> : null}
    </AccountCard>
  );
}
