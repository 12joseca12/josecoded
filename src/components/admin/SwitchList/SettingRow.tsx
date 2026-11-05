"use client";

import { type SyntheticEvent, useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import {
  payoutCadences,
  type SettingKind,
  type SettingValue,
  type SettingView,
} from "@/lib/settings/definitions";
import { fromDraft, toDraft } from "@/lib/settings/draft";
import { formatMadridStamp } from "@/lib/settings/madrid-time";
import type {
  SettingActionResult,
  SettingItemLabels,
  SettingRowLabels,
  SettingSaveHandler,
} from "@/types/system";

import styles from "./SwitchList.module.css";

interface SettingRowProps {
  setting: SettingView;
  item: SettingItemLabels;
  labels: SettingRowLabels;
  locale: string;
  save: SettingSaveHandler;
  readOnly: boolean;
}

type Feedback = { tone: "success" | "error"; text: string } | null;

const numberBounds: Partial<Record<SettingKind, { min: number; max: number; step: string }>> = {
  hours: { min: 0, max: 80, step: "1" },
  delay: { min: 0, max: 240, step: "1" },
  vat: { min: 0, max: 100, step: "0.01" },
};

const textInputs: Partial<Record<SettingKind, "month" | "date" | "number">> = {
  month: "month",
  date: "date",
  hours: "number",
  delay: "number",
  vat: "number",
};

function describe(result: SettingActionResult, labels: SettingRowLabels): Feedback {
  if (result.status === "done") return { tone: "success", text: labels.saved };
  return { tone: "error", text: labels.errors[result.status] };
}

function isOn(value: SettingValue): boolean {
  if (typeof value === "boolean") return value;
  return typeof value === "object" && value !== null ? value.on : false;
}

export function SettingRow({ setting, item, labels, locale, save, readOnly }: SettingRowProps) {
  const id = useId();
  const [value, setValue] = useState<SettingValue>(setting.value);
  const [draft, setDraft] = useState(() => toDraft(setting.kind, setting.value));
  const [updatedAt, setUpdatedAt] = useState(setting.updatedAt);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pending, startTransition] = useTransition();
  const { kind } = setting;
  const locked = readOnly || pending;
  const nameId = `${id}-name`;
  const hintId = `${id}-hint`;
  const inputType = textInputs[kind];
  const bounds = numberBounds[kind];

  const commit = (next: SettingValue | undefined) => {
    if (pending) return;
    if (next === undefined) {
      setFeedback({ tone: "error", text: labels.errors.invalid });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const result = await save({ key: setting.key, value: next });
      if (result.status === "done") {
        setValue(next);
        setUpdatedAt(result.updatedAt);
      }
      setFeedback(describe(result, labels));
    });
  };

  const onToggle = (checked: boolean) => {
    if (kind === "maintenance") commit(fromDraft(kind, draft, { on: checked }));
    else commit(checked);
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    commit(fromDraft(kind, draft, value));
  };

  const hasSwitch = kind === "switch" || kind === "maintenance";
  const on = isOn(value);

  return (
    <li className={styles.row} data-kind={kind}>
      <div className={styles.text}>
        <span id={nameId} className={styles.name}>
          {item.name}
        </span>
        <span id={hintId} className={styles.hint}>
          {item.hint}
        </span>
        <span className={styles.meta}>
          {kind === "switch" ? (
            <span className={styles.badge} data-wired={setting.wired ? "true" : "false"}>
              {setting.wired ? labels.wired : labels.notWired}
            </span>
          ) : null}
          <span>
            {updatedAt
              ? labels.updatedAt.replace("{date}", formatMadridStamp(updatedAt, locale))
              : labels.neverSaved}
          </span>
        </span>
      </div>
      <div className={styles.control}>
        {hasSwitch ? (
          <label className={styles.switch} data-busy={pending ? "true" : undefined}>
            <input
              type="checkbox"
              role="switch"
              className={styles.input}
              checked={on}
              disabled={locked}
              aria-labelledby={nameId}
              aria-describedby={hintId}
              onChange={(event) => {
                onToggle(event.currentTarget.checked);
              }}
            />
            <span className={styles.track} aria-hidden="true">
              <span className={styles.thumb} />
            </span>
            <span className={styles.state} aria-hidden="true">
              {on ? labels.on : labels.off}
            </span>
          </label>
        ) : null}
        {kind === "cadence" ? (
          <select
            className={styles.field}
            value={typeof value === "string" ? value : ""}
            disabled={locked}
            aria-labelledby={nameId}
            aria-describedby={hintId}
            onChange={(event) => {
              commit(event.currentTarget.value);
            }}
          >
            {payoutCadences.map((cadence) => (
              <option key={cadence} value={cadence}>
                {labels.cadence[cadence]}
              </option>
            ))}
          </select>
        ) : null}
        {inputType || kind === "maintenance" ? (
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            {kind === "maintenance" ? (
              <label className={styles.inline} htmlFor={`${id}-until`}>
                {labels.maintenanceUntil}
              </label>
            ) : null}
            <input
              id={`${id}-until`}
              className={styles.field}
              type={kind === "maintenance" ? "datetime-local" : inputType}
              value={draft}
              disabled={locked}
              min={bounds?.min}
              max={bounds?.max}
              step={bounds?.step}
              inputMode={inputType === "number" ? "decimal" : undefined}
              autoComplete="off"
              aria-labelledby={kind === "maintenance" ? undefined : nameId}
              aria-describedby={hintId}
              onChange={(event) => {
                setDraft(event.currentTarget.value);
              }}
            />
            {kind === "hours" || kind === "delay" || kind === "vat" ? (
              <span className={styles.unit}>{labels.unit[kind]}</span>
            ) : null}
            {readOnly ? null : (
              <Button
                type="submit"
                variant="light"
                size="sm"
                loading={pending}
                loadingLabel={labels.saving}
              >
                {labels.save}
              </Button>
            )}
          </form>
        ) : null}
      </div>
      <p className={styles.feedback} data-tone="success" role="status">
        {feedback?.tone === "success" ? feedback.text : null}
      </p>
      <p className={styles.feedback} data-tone="error" role="alert">
        {feedback?.tone === "error" ? feedback.text : null}
      </p>
    </li>
  );
}
