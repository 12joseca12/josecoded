"use client";

import { type SyntheticEvent, useEffect, useRef, useState } from "react";

import { submitContact } from "@/app/[locale]/(site)/contacto/actions";
import { Button } from "@/components/ui/Button/Button";
import { Card } from "@/components/ui/Card/Card";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup/ChoiceGroup";
import { Field } from "@/components/ui/Field/Field";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import {
  collectFieldErrors,
  type ContactFieldErrors,
  contactFieldNames,
  type ContactFormLabels,
  contactFormSchema,
  type ContactSubmitResult,
} from "@/types/contact-form";
import { type WayId, wayIds } from "@/types/services";

import { TurnstileField, type TurnstileHandle } from "../TurnstileField/TurnstileField";
import styles from "./ContactForm.module.css";

export interface ContactFormProps {
  locale: string;
  labels: ContactFormLabels;
  emails: Record<WayId, string>;
  initialWay: WayId | null;
  pack: string | null;
  privacyHref: string;
  newTabLabel: string;
  turnstile: { siteKey: string; scriptUrl: string } | null;
}

type View = "form" | "sent" | "unavailable";
type Notice = "quota" | "verification_failed" | "failed";

const noticeByStatus = {
  quota: "quota",
  verification_failed: "verification_failed",
  error: "failed",
} as const satisfies Record<string, Notice>;

function textOf(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

function mailto(email: string) {
  return <Link href={`mailto:${email}`}>{email}</Link>;
}

export function ContactForm({
  locale,
  labels,
  emails,
  initialWay,
  pack,
  privacyHref,
  newTabLabel,
  turnstile,
}: ContactFormProps) {
  const [view, setView] = useState<View>(turnstile ? "form" : "unavailable");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [verificationError, setVerificationError] = useState(false);
  const [pending, setPending] = useState(false);
  const [way, setWay] = useState<WayId>(initialWay ?? "contratacion");
  const [session, setSession] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const token = useRef<string | null>(null);
  const widget = useRef<TurnstileHandle>(null);
  const noticeBox = useRef<HTMLDivElement>(null);
  const sentHeading = useRef<HTMLDivElement>(null);
  const afterRender = useRef<(() => void) | null>(null);

  useEffect(() => {
    afterRender.current?.();
    afterRender.current = null;
  });

  const focusFirstInvalid = (found: ContactFieldErrors, missingVerification: boolean) => {
    const first = contactFieldNames.find((name) => found[name] !== undefined);
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    } else if (missingVerification) {
      widget.current?.focus();
    }
  };

  const clearFieldError = (name: string) => {
    if (name === "homepage") return;
    setErrors((current) => {
      if (!(name in current)) return current;
      return Object.fromEntries(Object.entries(current).filter(([key]) => key !== name));
    });
  };

  const applyResult = (result: ContactSubmitResult) => {
    if (result.status === "sent") {
      afterRender.current = () => {
        sentHeading.current?.focus();
      };
      setView("sent");
      return;
    }
    if (result.status === "unavailable") {
      setView("unavailable");
      return;
    }
    if (result.status === "invalid") {
      setErrors(result.errors);
      afterRender.current = () => {
        focusFirstInvalid(result.errors, false);
      };
      return;
    }
    setNotice(noticeByStatus[result.status]);
    afterRender.current = () => {
      noticeBox.current?.focus();
    };
  };

  const onSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const chosenWay = textOf(data, "way");
    const parsed = contactFormSchema.safeParse({
      way: chosenWay === "" ? undefined : chosenWay,
      name: textOf(data, "name"),
      email: textOf(data, "email"),
      company: textOf(data, "company"),
      message: textOf(data, "message"),
      consent: data.get("consent") === "on",
      pack: chosenWay === "packs" && pack ? pack : undefined,
      homepage: textOf(data, "homepage"),
    });
    const found = parsed.success ? {} : collectFieldErrors(parsed.error);
    const verificationToken = token.current;
    const missingVerification = verificationToken === null;
    setNotice(null);
    setErrors(found);
    setVerificationError(missingVerification);
    if (!parsed.success || verificationToken === null) {
      afterRender.current = () => {
        focusFirstInvalid(found, missingVerification);
      };
      return;
    }

    setWay(parsed.data.way);
    setPending(true);
    let result: ContactSubmitResult;
    try {
      result = await submitContact({
        ...parsed.data,
        locale,
        turnstileToken: verificationToken,
      });
    } catch {
      result = { status: "error" };
    }
    setPending(false);
    widget.current?.reset();
    applyResult(result);
  };

  if (view === "unavailable") {
    return (
      <Card tone="error" size="sm" className={styles.unavailable}>
        <Heading level={3} size="h4">
          {labels.unavailable.title}
        </Heading>
        <p>{labels.unavailable.text}</p>
        <ul className={styles.emails}>
          {wayIds.map((id) => (
            <li key={id}>
              <span className={styles.emailWay}>{labels.ways[id].label}</span>
              {mailto(emails[id])}
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  if (view === "sent") {
    return (
      <div className={styles.sent} role="status">
        <div ref={sentHeading} tabIndex={-1} className={styles.sentHeading}>
          <Heading level={3} size="h4">
            {labels.sent.title}
          </Heading>
        </div>
        <p>{labels.sent.text}</p>
        <p>
          {labels.sent.alternative} {mailto(emails[way])}
        </p>
        <Button
          variant="quiet"
          size="sm"
          onClick={() => {
            token.current = null;
            setErrors({});
            setNotice(null);
            setSession((count) => count + 1);
            setView("form");
          }}
        >
          {labels.sent.again}
        </Button>
      </div>
    );
  }

  const invalidCount = Object.keys(errors).length + (verificationError ? 1 : 0);
  const errorText = (code: string | undefined) =>
    code === undefined ? undefined : (labels.errors[code] ?? labels.genericError);
  const noticeText =
    notice === "quota"
      ? labels.quota
      : notice === "verification_failed"
        ? labels.verificationFailed
        : labels.failed;

  return (
    <form
      key={session}
      ref={form}
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      onInput={(event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          clearFieldError(target.name);
        }
      }}
    >
      {invalidCount > 0 ? (
        <p className={styles.summary} role="alert">
          {(invalidCount === 1 ? labels.summaryOne : labels.summaryMany).replace(
            "{count}",
            String(invalidCount),
          )}
        </p>
      ) : null}
      <ChoiceGroup
        name="way"
        legend={labels.wayLegend}
        defaultValue={initialWay}
        required
        error={errorText(errors.way)}
        options={wayIds.map((id) => ({
          value: id,
          label: labels.ways[id].label,
          hint: labels.ways[id].hint,
        }))}
      />
      <div className={styles.pair}>
        <Field
          name="name"
          label={labels.nameLabel}
          autoComplete="name"
          required
          error={errorText(errors.name)}
        />
        <Field
          name="email"
          type="email"
          label={labels.emailLabel}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          required
          error={errorText(errors.email)}
        />
      </div>
      <Field
        name="company"
        label={labels.companyLabel}
        optionalLabel={labels.optional}
        autoComplete="organization"
        error={errorText(errors.company)}
      />
      <Field
        control="textarea"
        name="message"
        label={labels.messageLabel}
        hint={labels.messageHint}
        rows={6}
        required
        error={errorText(errors.message)}
      />
      <div className={styles.trap} aria-hidden="true">
        <label>
          {labels.honeypotLabel}
          <input type="text" name="homepage" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <Checkbox name="consent" required error={errorText(errors.consent)}>
        {labels.consentBefore}
        <Link href={privacyHref} external newTabLabel={newTabLabel}>
          {labels.consentLink}
        </Link>
        {labels.consentAfter}
      </Checkbox>
      <TurnstileField
        ref={widget}
        siteKey={turnstile?.siteKey ?? ""}
        scriptUrl={turnstile?.scriptUrl ?? ""}
        locale={locale}
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
      {notice ? (
        <div ref={noticeBox} role="alert" tabIndex={-1} className={styles.notice}>
          <Card tone="error" size="sm">
            <Heading level={3} size="h4">
              {noticeText.title}
            </Heading>
            <p>{noticeText.text}</p>
            {notice !== "verification_failed" ? (
              <p>
                {(notice === "quota" ? labels.quota.alternative : labels.failed.alternative) + " "}
                {mailto(emails[way])}
              </p>
            ) : null}
          </Card>
        </div>
      ) : null}
      <div className={styles.actions}>
        <Button type="submit" loading={pending} loadingLabel={labels.submitting}>
          {labels.submit}
        </Button>
      </div>
    </form>
  );
}
