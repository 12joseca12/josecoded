"use client";

import { type SyntheticEvent, useRef, useState, useTransition } from "react";

import { saveProfile } from "@/app/[locale]/(private)/cuenta/actions";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { locales } from "@/i18n/config";
import type { ProfileFieldError, ProfileFormLabels } from "@/types/account";

import { AccountCard } from "../AccountCard/AccountCard";
import { AccountFeedback, type FeedbackState } from "../AccountFeedback/AccountFeedback";
import styles from "./ProfileForm.module.css";

interface ProfileFormProps {
  locale: string;
  email: string | null;
  fullName: string;
  profileLocale: string;
  labels: ProfileFormLabels;
}

type FieldErrors = Partial<Record<"fullName" | "locale", ProfileFieldError>>;

export function ProfileForm({ locale, email, fullName, profileLocale, labels }: ProfileFormProps) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const form = useRef<HTMLFormElement>(null);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setFeedback(null);
    startTransition(async () => {
      const result = await saveProfile(locale, {
        fullName: data.get("fullName"),
        locale: data.get("locale"),
      });
      if (result.status === "done") {
        setErrors({});
        setFeedback({ tone: "success", text: labels.saved });
        return;
      }
      if (result.status === "invalid") {
        const field = result.error === "locale_invalid" ? "locale" : "fullName";
        setErrors({ [field]: result.error });
        form.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
        return;
      }
      setErrors({});
      setFeedback({ tone: "error", text: labels.errors[result.code] });
    });
  };

  return (
    <AccountCard id="profile" title={labels.title} lead={labels.lead}>
      <form ref={form} className={styles.form} noValidate onSubmit={onSubmit}>
        <Field
          name="email"
          label={labels.emailLabel}
          hint={labels.emailHint}
          type="email"
          value={email ?? ""}
          readOnly
        />
        <Field
          name="fullName"
          label={labels.nameLabel}
          defaultValue={fullName}
          autoComplete="name"
          maxLength={200}
          required
          error={errors.fullName ? labels.errors[errors.fullName] : undefined}
        />
        <Field
          control="select"
          name="locale"
          label={labels.localeLabel}
          hint={labels.localeHint}
          defaultValue={profileLocale}
          error={errors.locale ? labels.errors[errors.locale] : undefined}
        >
          {locales.map((value) => (
            <option key={value} value={value}>
              {labels.localeOptions[value]}
            </option>
          ))}
        </Field>
        <AccountFeedback feedback={feedback} />
        <div className={styles.actions}>
          <Button type="submit" loading={pending} loadingLabel={labels.saving}>
            {labels.save}
          </Button>
        </div>
      </form>
    </AccountCard>
  );
}
