"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useEffect, useRef, useState } from "react";

import { requestCode, startGoogle, verifyCode } from "@/app/[locale]/(site)/entrar/actions";
import {
  TurnstileField,
  type TurnstileHandle,
} from "@/components/contact/TurnstileField/TurnstileField";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import {
  type AuthFormLabels,
  type NoticeLabels,
  otpLength,
  otpPattern,
  type RequestCodeResult,
  resendCooldownSeconds,
} from "@/types/auth";

import { AuthCard } from "../AuthCard/AuthCard";
import { AuthNotice } from "../AuthNotice/AuthNotice";
import styles from "./LoginForm.module.css";

export interface LoginFormProps {
  locale: string;
  next: string | null;
  labels: AuthFormLabels;
  googleEnabled: boolean;
  turnstile: { siteKey: string; scriptUrl: string } | null;
  invitedEmail?: string | null;
}

type Step = "email" | "code";
type NoticeKind = "wrong_code" | "rate_limited" | "verification_failed" | "failed";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loginAction = "login";
const tickMs = 1000;

function textOf(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function LoginForm({
  locale,
  next,
  labels,
  googleEnabled,
  turnstile,
  invitedEmail = null,
}: LoginFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(invitedEmail ?? "");
  const [pending, setPending] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [codeError, setCodeError] = useState<string | undefined>();
  const [verificationError, setVerificationError] = useState(false);
  const [notice, setNotice] = useState<NoticeKind | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [resent, setResent] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const token = useRef<string | null>(null);
  const widget = useRef<TurnstileHandle>(null);
  const noticeBox = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLElement>(null);
  const afterRender = useRef<(() => void) | null>(null);

  useEffect(() => {
    afterRender.current?.();
    afterRender.current = null;
  });

  useEffect(() => {
    if (resendAt === 0) return;
    const update = () => {
      const left = Math.max(0, Math.ceil((resendAt - Date.now()) / tickMs));
      setRemaining(left);
      return left;
    };
    update();
    const timer = window.setInterval(() => {
      if (update() === 0) window.clearInterval(timer);
    }, tickMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [resendAt]);

  const showNotice = (kind: NoticeKind) => {
    setNotice(kind);
    afterRender.current = () => {
      noticeBox.current?.focus();
    };
  };

  const noticeLabels: Record<NoticeKind, NoticeLabels> = {
    wrong_code: labels.wrongCode,
    rate_limited: labels.rateLimited,
    verification_failed: labels.verificationFailed,
    failed: labels.failed,
  };

  const startCooldown = () => {
    setResendAt(Date.now() + resendCooldownSeconds * tickMs);
    setRemaining(resendCooldownSeconds);
  };

  const sendCode = async (address: string): Promise<RequestCodeResult["status"]> => {
    const verificationToken = token.current;
    if (verificationToken === null) {
      setVerificationError(true);
      afterRender.current = () => {
        widget.current?.focus();
      };
      return "invalid";
    }
    setVerificationError(false);
    setNotice(null);
    setPending(true);
    let result: RequestCodeResult;
    try {
      result = await requestCode({ email: address, turnstileToken: verificationToken, locale });
    } catch {
      result = { status: "error" };
    }
    setPending(false);
    widget.current?.reset();
    if (result.status === "sent") return "sent";
    if (result.status === "invalid") {
      setEmailError(labels.errors[result.error] ?? labels.genericError);
      return "invalid";
    }
    showNotice(
      result.status === "rate_limited"
        ? "rate_limited"
        : result.status === "verification_failed"
          ? "verification_failed"
          : "failed",
    );
    return result.status;
  };

  const onSubmitEmail = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const address = textOf(new FormData(event.currentTarget), "email");
    setNotice(null);
    if (address === "") {
      setEmailError(labels.errors.email_required);
      form.current?.querySelector<HTMLElement>('[name="email"]')?.focus();
      return;
    }
    if (!emailPattern.test(address)) {
      setEmailError(labels.errors.email_invalid);
      form.current?.querySelector<HTMLElement>('[name="email"]')?.focus();
      return;
    }
    setEmailError(undefined);
    const status = await sendCode(address);
    if (status !== "sent") return;
    token.current = null;
    setEmail(address);
    setStep("code");
    startCooldown();
    afterRender.current = () => {
      head.current?.focus();
    };
  };

  const onResend = async () => {
    if (pending || remaining > 0) return;
    const status = await sendCode(email);
    if (status !== "sent") return;
    setResent(true);
    startCooldown();
  };

  const onSubmitCode = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || navigating) return;
    const code = textOf(new FormData(event.currentTarget), "code");
    setNotice(null);
    if (!otpPattern.test(code)) {
      setCodeError(labels.errors.code_invalid);
      form.current?.querySelector<HTMLElement>('[name="code"]')?.focus();
      return;
    }
    setCodeError(undefined);
    setResent(false);
    setPending(true);
    let destination: string | null = null;
    let failure: NoticeKind = "failed";
    try {
      const result = await verifyCode({ email, code, locale, next: next ?? undefined });
      if (result.status === "ok") destination = result.destination;
      else if (result.status === "wrong_code") failure = "wrong_code";
      else if (result.status === "rate_limited") failure = "rate_limited";
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
    if (form.current) {
      const input = form.current.querySelector<HTMLInputElement>('[name="code"]');
      if (input) input.value = "";
    }
    showNotice(failure);
  };

  const onGoogle = async () => {
    if (pending) return;
    setPending(true);
    try {
      const result = await startGoogle({ locale, next: next ?? undefined });
      if (result.status === "redirect") {
        window.location.assign(result.url);
        return;
      }
    } catch {
      showNotice("failed");
    }
    setPending(false);
  };

  const noticeBlock = notice ? <AuthNotice ref={noticeBox} notice={noticeLabels[notice]} /> : null;

  if (turnstile === null) {
    return (
      <AuthCard title={labels.title}>
        <AuthNotice notice={labels.unavailable} />
      </AuthCard>
    );
  }

  if (step === "code") {
    return (
      <AuthCard
        title={labels.codeTitle}
        lead={labels.codeLead.replace("{email}", email)}
        headRef={head}
      >
        <form
          key="code"
          ref={form}
          className={styles.form}
          noValidate
          onSubmit={(event) => {
            void onSubmitCode(event);
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
          {noticeBlock}
          <div className={styles.actions}>
            <Button type="submit" loading={pending || navigating} loadingLabel={labels.verifying}>
              {labels.verify}
            </Button>
          </div>
        </form>
        <div className={styles.resend}>
          <TurnstileField
            ref={widget}
            siteKey={turnstile.siteKey}
            scriptUrl={turnstile.scriptUrl}
            locale={locale}
            action={loginAction}
            label={labels.verificationLabel}
            loadingLabel={labels.verificationLoading}
            loadFailedLabel={labels.verificationLoadFailed}
            retryLabel={labels.verificationRetry}
            error={verificationError ? labels.errors.verification_required : undefined}
            onToken={(value) => {
              token.current = value;
              if (value !== null) setVerificationError(false);
            }}
          />
          <div className={styles.resendRow}>
            <Button
              variant="quiet"
              size="sm"
              disabled={remaining > 0 || navigating}
              loading={pending && !navigating}
              loadingLabel={labels.sending}
              onClick={() => {
                void onResend();
              }}
            >
              {remaining > 0
                ? labels.resendIn.replace("{seconds}", String(remaining))
                : labels.resend}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending || navigating}
              onClick={() => {
                setStep("email");
                setNotice(null);
                setResent(false);
                setCodeError(undefined);
              }}
            >
              {labels.changeEmail}
            </Button>
          </div>
          <p className={styles.resent} role="status">
            {resent ? labels.resent : ""}
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={labels.title} lead={labels.lead}>
      <form
        key="email"
        ref={form}
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          void onSubmitEmail(event);
        }}
        onInput={() => {
          setEmailError(undefined);
        }}
      >
        <Field
          name="email"
          type="email"
          label={labels.emailLabel}
          hint={labels.emailHint}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          defaultValue={email}
          readOnly={invitedEmail !== null}
          required
          error={emailError}
        />
        <TurnstileField
          ref={widget}
          siteKey={turnstile.siteKey}
          scriptUrl={turnstile.scriptUrl}
          locale={locale}
          action={loginAction}
          label={labels.verificationLabel}
          loadingLabel={labels.verificationLoading}
          loadFailedLabel={labels.verificationLoadFailed}
          retryLabel={labels.verificationRetry}
          error={verificationError ? labels.errors.verification_required : undefined}
          onToken={(value) => {
            token.current = value;
            if (value !== null) setVerificationError(false);
          }}
        />
        {noticeBlock}
        <div className={styles.actions}>
          <Button type="submit" loading={pending} loadingLabel={labels.sending}>
            {labels.send}
          </Button>
        </div>
      </form>
      {googleEnabled ? (
        <div className={styles.google}>
          <p className={styles.divider} aria-hidden="true">
            {labels.googleDivider}
          </p>
          <Button
            variant="light"
            disabled={pending}
            onClick={() => {
              void onGoogle();
            }}
          >
            {labels.google}
          </Button>
        </div>
      ) : null}
    </AuthCard>
  );
}
