"use client";

import { type SyntheticEvent, useId, useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Field } from "@/components/ui/Field/Field";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import {
  type ChatLabels,
  collectHandoffErrors,
  type HandoffFieldErrors,
  type HandoffInput,
  handoffInputSchema,
  type HandoffState,
} from "@/types/chat";

import styles from "./HandoffCard.module.css";

interface HandoffCardProps {
  labels: ChatLabels["handoff"];
  state: HandoffState;
  onSubmit: (input: HandoffInput) => Promise<void>;
}

function textOf(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

export function HandoffCard({ labels, state, onSubmit }: HandoffCardProps) {
  const titleId = useId();
  const [localErrors, setLocalErrors] = useState<HandoffFieldErrors>({});
  const errors = { ...state.errors, ...localErrors };
  const sending = state.phase === "sending";

  if (state.phase === "done") {
    return (
      <section className={styles.card} data-state="done" role="status">
        <Heading level={3} size="h4">
          {labels.doneTitle}
        </Heading>
        <p className={styles.text}>{labels.doneText}</p>
      </section>
    );
  }

  const text = (code: string | undefined) =>
    code === undefined ? undefined : (labels.errors[code] ?? code);

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = handoffInputSchema.safeParse({
      name: textOf(data, "name"),
      email: textOf(data, "email"),
      phone: textOf(data, "phone"),
      consent: data.get("consent") === "on",
    });
    if (!parsed.success) {
      setLocalErrors(collectHandoffErrors(parsed.error));
      return;
    }
    setLocalErrors({});
    void onSubmit(parsed.data);
  };

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <Heading level={3} size="h4" id={titleId}>
        {labels.title}
      </Heading>
      <p className={styles.text}>{labels.lead}</p>
      <form className={styles.form} onSubmit={submit} noValidate>
        <Field
          name="name"
          label={labels.nameLabel}
          optionalLabel={labels.optional}
          autoComplete="name"
          error={text(errors.name)}
        />
        <Field
          name="email"
          type="email"
          label={labels.emailLabel}
          hint={labels.contactHint}
          autoComplete="email"
          error={text(errors.email)}
        />
        <Field
          name="phone"
          type="tel"
          label={labels.phoneLabel}
          autoComplete="tel"
          inputMode="tel"
          error={text(errors.phone)}
        />
        <Checkbox name="consent" error={text(errors.consent)}>
          {labels.consentBefore}
          <Link href={labels.privacyHref} external newTabLabel={labels.newTab}>
            {labels.consentLink}
          </Link>
          {labels.consentAfter}
        </Checkbox>
        {state.failed ? (
          <p className={styles.failed} role="alert">
            {labels.failed}
          </p>
        ) : null}
        <Button type="submit" size="sm" loading={sending} loadingLabel={labels.submitting}>
          {labels.submit}
        </Button>
      </form>
    </section>
  );
}
