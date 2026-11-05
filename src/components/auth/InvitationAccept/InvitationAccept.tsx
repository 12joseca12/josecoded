"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { locales } from "@/i18n/config";
import type { AcceptHandler, InvitationLabels } from "@/types/invitation";

import styles from "./InvitationAccept.module.css";

interface InvitationAcceptProps {
  token: string;
  locale: string;
  labels: InvitationLabels;
  accept: AcceptHandler;
}

export function InvitationAccept({ token, locale, labels, accept }: InvitationAcceptProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [navigating, setNavigating] = useState(false);

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || navigating) return;
    const data = new FormData(event.currentTarget);
    const name = data.get("fullName");
    const choice = data.get("locale");
    const fullName = typeof name === "string" ? name.trim() : "";
    const chosen = typeof choice === "string" ? choice : locale;
    setError(null);
    if (fullName === "" || fullName.length > 200) {
      setFieldError(labels.errors.name);
      event.currentTarget.querySelector<HTMLElement>('[name="fullName"]')?.focus();
      return;
    }
    setFieldError(undefined);
    startTransition(async () => {
      const result = await accept({ token, fullName, locale: chosen });
      if (result.status === "done") {
        setNavigating(true);
        router.replace(result.destination);
        return;
      }
      if (result.status === "invalid") {
        setFieldError(labels.errors.name);
        return;
      }
      setError(labels.errors[result.failure]);
    });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <Field
        name="fullName"
        label={labels.nameLabel}
        hint={labels.nameHint}
        autoComplete="name"
        maxLength={200}
        required
        error={fieldError}
        disabled={pending || navigating}
        onInput={() => {
          setFieldError(undefined);
        }}
      />
      <Field
        control="select"
        name="locale"
        label={labels.localeLabel}
        defaultValue={locale}
        disabled={pending || navigating}
      >
        {locales.map((value) => (
          <option key={value} value={value}>
            {labels.locales[value]}
          </option>
        ))}
      </Field>
      {error !== null ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="accent"
        loading={pending || navigating}
        loadingLabel={labels.accepting}
      >
        {labels.accept}
      </Button>
    </form>
  );
}
