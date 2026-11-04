"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type SyntheticEvent, useEffect, useRef, useState } from "react";

import { startEnrollment, verifyTotp } from "@/app/[locale]/(site)/entrar/actions";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { Link } from "@/components/ui/Link/Link";
import { type NoticeLabels, otpLength, otpPattern, type TotpFormLabels } from "@/types/auth";

import { AuthCard } from "../AuthCard/AuthCard";
import { AuthNotice } from "../AuthNotice/AuthNotice";
import styles from "./TotpForm.module.css";

export interface TotpFormProps {
  locale: string;
  next: string | null;
  labels: TotpFormLabels;
  mode: "enroll" | "challenge";
  factorId: string | null;
  loginHref: string;
  lostDeviceHref: string;
}

type NoticeKind = "wrong_code" | "rate_limited" | "failed";

interface Enrollment {
  factorId: string;
  qrCode: string;
  secret: string;
}

const qrSize = 192;

export function TotpForm({
  locale,
  next,
  labels,
  mode,
  factorId,
  loginHref,
  lostDeviceHref,
}: TotpFormProps) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [starting, setStarting] = useState(false);
  const [pending, setPending] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [codeError, setCodeError] = useState<string | undefined>();
  const [notice, setNotice] = useState<NoticeKind | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const noticeBox = useRef<HTMLDivElement>(null);
  const afterRender = useRef<(() => void) | null>(null);

  useEffect(() => {
    afterRender.current?.();
    afterRender.current = null;
  });

  const noticeLabels: Record<NoticeKind, NoticeLabels> = {
    wrong_code: labels.wrongCode,
    rate_limited: labels.rateLimited,
    failed: labels.failed,
  };

  const showNotice = (kind: NoticeKind) => {
    setNotice(kind);
    afterRender.current = () => {
      noticeBox.current?.focus();
    };
  };

  const onStart = async () => {
    if (starting) return;
    setStarting(true);
    setNotice(null);
    try {
      const result = await startEnrollment();
      if (result.status === "ready") {
        setEnrollment({ factorId: result.factorId, qrCode: result.qrCode, secret: result.secret });
        afterRender.current = () => {
          form.current?.querySelector<HTMLElement>('[name="code"]')?.focus();
        };
      } else if (result.status === "unauthenticated") {
        router.replace(loginHref);
        return;
      } else {
        showNotice(result.status === "rate_limited" ? "rate_limited" : "failed");
      }
    } catch {
      showNotice("failed");
    }
    setStarting(false);
  };

  const activeFactor = mode === "enroll" ? (enrollment?.factorId ?? null) : factorId;

  const onSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || navigating || activeFactor === null) return;
    const entry = new FormData(event.currentTarget).get("code");
    const code = typeof entry === "string" ? entry.trim() : "";
    setNotice(null);
    if (!otpPattern.test(code)) {
      setCodeError(labels.errors.code_invalid);
      form.current?.querySelector<HTMLElement>('[name="code"]')?.focus();
      return;
    }
    setCodeError(undefined);
    setPending(true);
    let destination: string | null = null;
    let failure: NoticeKind = "failed";
    try {
      const result = await verifyTotp({
        factorId: activeFactor,
        code,
        locale,
        next: next ?? undefined,
      });
      if (result.status === "ok") destination = result.destination;
      else if (result.status === "wrong_code") failure = "wrong_code";
      else if (result.status === "rate_limited") failure = "rate_limited";
      else if (result.status === "unauthenticated") destination = loginHref;
      else if (result.status === "invalid") setCodeError(labels.errors[result.error]);
    } catch {
      failure = "failed";
    }
    if (destination !== null) {
      setNavigating(true);
      router.replace(destination);
      return;
    }
    setPending(false);
    const input = form.current?.querySelector<HTMLInputElement>('[name="code"]');
    if (input) input.value = "";
    showNotice(failure);
  };

  const codeForm = (
    <form
      ref={form}
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        void onSubmit(event);
      }}
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
      {notice ? <AuthNotice ref={noticeBox} notice={noticeLabels[notice]} /> : null}
      <div className={styles.actions}>
        <Button type="submit" loading={pending || navigating} loadingLabel={labels.verifying}>
          {labels.verify}
        </Button>
      </div>
    </form>
  );

  const lostDevice = (
    <p className={styles.lost}>
      {labels.lostDevice} <Link href={lostDeviceHref}>{labels.lostDeviceLink}</Link>
    </p>
  );

  if (mode === "challenge") {
    return (
      <AuthCard title={labels.challengeTitle} lead={labels.challengeLead}>
        {codeForm}
        {lostDevice}
      </AuthCard>
    );
  }

  if (enrollment === null) {
    return (
      <AuthCard title={labels.enrollTitle} lead={labels.enrollLead}>
        {notice ? <AuthNotice ref={noticeBox} notice={noticeLabels[notice]} /> : null}
        <div className={styles.actions}>
          <Button
            loading={starting}
            loadingLabel={labels.enrollStarting}
            onClick={() => {
              void onStart();
            }}
          >
            {labels.enrollStart}
          </Button>
        </div>
        {lostDevice}
      </AuthCard>
    );
  }

  return (
    <AuthCard title={labels.enrollTitle} lead={labels.enrollLead}>
      <section className={styles.scan} aria-labelledby="totp-scan">
        <p id="totp-scan" className={styles.scanLabel}>
          {labels.scanLabel}
        </p>
        <Image
          className={styles.qr}
          src={enrollment.qrCode}
          alt={labels.qrAlt}
          width={qrSize}
          height={qrSize}
          unoptimized
        />
        <div className={styles.secret}>
          <p className={styles.secretLabel}>{labels.secretLabel}</p>
          <code className={styles.secretValue}>{enrollment.secret}</code>
        </div>
      </section>
      {codeForm}
    </AuthCard>
  );
}
