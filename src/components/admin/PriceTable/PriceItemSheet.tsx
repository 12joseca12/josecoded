"use client";

import { type SyntheticEvent, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Field } from "@/components/ui/Field/Field";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import {
  type PriceActionHandler,
  type PriceActionLabels,
  type PriceActionResult,
  priceInputSchema,
  type PriceItem,
  type PriceSheetLabels,
} from "@/types/prices";

import styles from "./PriceItemSheet.module.css";

interface PriceItemSheetProps {
  item: PriceItem | null;
  name: string;
  labels: PriceSheetLabels;
  actionLabels: PriceActionLabels;
  save: PriceActionHandler;
  onClose: () => void;
  onSaved: (message: string) => void;
}

function textOf(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

function messageFor(result: PriceActionResult, labels: PriceActionLabels): string | null {
  if (result.status === "done") return null;
  if (result.status === "invalid") return labels.errors[result.field];
  return labels.errors[result.status];
}

interface PriceItemFormProps {
  item: PriceItem;
  name: string;
  labels: PriceSheetLabels;
  actionLabels: PriceActionLabels;
  save: PriceActionHandler;
  onClose: () => void;
  onSaved: (message: string) => void;
}

function PriceItemForm({
  item,
  name,
  labels,
  actionLabels,
  save,
  onClose,
  onSaved,
}: PriceItemFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startSave] = useTransition();
  const hasVisibility = item.table === "extras" || item.table === "plans";

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const price = textOf(data, "price").trim();
    if (!priceInputSchema.safeParse(price).success) {
      setError(actionLabels.errors.price);
      return;
    }
    const weeks =
      item.weeks === null
        ? {}
        : {
            weeksMin: Number(textOf(data, "weeksMin")),
            weeksMax: Number(textOf(data, "weeksMax")),
          };
    setError(null);
    startSave(async () => {
      const result = await save({
        table: item.table,
        key: item.key,
        expectedUpdatedAt: item.updatedAt,
        price,
        ...weeks,
        ...(hasVisibility ? { visible: data.get("visible") === "on" } : {}),
      });
      const failure = messageFor(result, actionLabels);
      if (failure) {
        setError(failure);
        return;
      }
      onSaved(actionLabels.done.save);
    });
  };

  return (
    <form className={styles.inner} onSubmit={onSubmit} noValidate>
      <div className={styles.head}>
        <h2 className={styles.title} id="price-sheet-title">
          {labels.title.replace("{name}", name)}
        </h2>
        <IconButton label={labels.close} onClick={onClose}>
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </IconButton>
      </div>
      <Field
        name="price"
        label={labels.priceLabel}
        hint={labels.priceHint}
        defaultValue={item.price === null ? "" : String(item.price)}
        inputMode="decimal"
        autoComplete="off"
        maxLength={10}
        disabled={pending}
      />
      {item.weeks ? (
        <div className={styles.pair}>
          <Field
            name="weeksMin"
            label={labels.weeksMinLabel}
            type="number"
            min={1}
            max={104}
            defaultValue={item.weeks.min}
            disabled={pending}
          />
          <Field
            name="weeksMax"
            label={labels.weeksMaxLabel}
            type="number"
            min={1}
            max={104}
            defaultValue={item.weeks.max}
            disabled={pending}
          />
        </div>
      ) : null}
      {hasVisibility ? (
        <Checkbox name="visible" defaultChecked={item.visible} disabled={pending}>
          {labels.visibleLabel}
        </Checkbox>
      ) : null}
      <p className={styles.error} role="alert">
        {error}
      </p>
      <div className={styles.actions}>
        <Button type="button" variant="quiet" onClick={onClose} disabled={pending}>
          {labels.cancel}
        </Button>
        <Button type="submit" loading={pending} loadingLabel={labels.saving}>
          {labels.save}
        </Button>
      </div>
    </form>
  );
}

export function PriceItemSheet({ item, onClose, ...rest }: PriceItemSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = item !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby="price-sheet-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {item ? (
        <PriceItemForm
          key={`${item.table}:${item.key}:${item.updatedAt}`}
          item={item}
          onClose={onClose}
          {...rest}
        />
      ) : null}
    </dialog>
  );
}
