import { useId } from "react";

import { Button } from "@/components/ui/Button/Button";
import {
  type ImportDuplicateMode,
  importDuplicateModes,
  type ImportLabels,
  type ImportOwner,
} from "@/types/crm-import";

import styles from "./ImportOptions.module.css";

interface ImportOptionsProps {
  labels: ImportLabels;
  mode: ImportDuplicateMode;
  owners: ImportOwner[] | null;
  ownerId: string;
  importing: boolean;
  disabled: boolean;
  problem: string | null;
  onMode: (mode: ImportDuplicateMode) => void;
  onOwner: (ownerId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ImportOptions({
  labels,
  mode,
  owners,
  ownerId,
  importing,
  disabled,
  problem,
  onMode,
  onOwner,
  onConfirm,
  onCancel,
}: ImportOptionsProps) {
  const ownerSelect = useId();
  const text = labels.options;
  const hints: Record<ImportDuplicateMode, { label: string; hint: string }> = {
    skip: { label: text.skip, hint: text.skipHint },
    update: { label: text.update, hint: text.updateHint },
  };

  return (
    <div className={styles.options}>
      <fieldset className={styles.modes} disabled={importing}>
        <legend className={styles.legend}>{text.legend}</legend>
        {importDuplicateModes.map((value) => (
          <label key={value} className={styles.mode}>
            <input
              type="radio"
              name="on-duplicate"
              value={value}
              checked={mode === value}
              onChange={() => {
                onMode(value);
              }}
            />
            <span className={styles.modeText}>
              <span className={styles.modeLabel}>{hints[value].label}</span>
              <span className={styles.modeHint}>{hints[value].hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {owners !== null ? (
        <div className={styles.owner}>
          <label htmlFor={ownerSelect}>{text.owner}</label>
          <select
            id={ownerSelect}
            value={ownerId}
            disabled={importing}
            onChange={(event) => {
              onOwner(event.currentTarget.value);
            }}
          >
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {problem !== null ? (
        <p className={styles.problem} role="alert">
          {problem}
        </p>
      ) : null}
      <div className={styles.actions}>
        <Button
          variant="accent"
          loading={importing}
          loadingLabel={labels.importing}
          disabled={disabled}
          onClick={onConfirm}
        >
          {labels.confirm}
        </Button>
        <Button variant="ghost" disabled={importing} onClick={onCancel}>
          {labels.cancel}
        </Button>
      </div>
    </div>
  );
}
