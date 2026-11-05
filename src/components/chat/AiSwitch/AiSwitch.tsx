"use client";

import { useId, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import type { AiSwitchLabels, RoomActionResult } from "@/types/room";

import styles from "./AiSwitch.module.css";

interface AiSwitchProps {
  enabled: boolean;
  offReason: string | null;
  disabled?: boolean;
  labels: AiSwitchLabels;
  onChange: (next: boolean) => Promise<RoomActionResult>;
  onChanged?: () => void;
}

export function AiSwitch({
  enabled,
  offReason,
  disabled = false,
  labels,
  onChange,
  onChanged,
}: AiSwitchProps) {
  const id = useId();
  const announce = useAnnounce();
  const [value, setValue] = useState(enabled);
  const [reason, setReason] = useState(offReason);
  const [problem, setProblem] = useState("");
  const [saving, startSaving] = useTransition();

  const toggle = () => {
    if (saving || disabled) return;
    const next = !value;
    setProblem("");
    startSaving(async () => {
      const result = await onChange(next);
      if (result.status === "done") {
        setValue(next);
        setReason(next ? null : "admin");
        announce(labels.changed);
        onChanged?.();
        return;
      }
      setProblem(labels.errors[result.code] ?? labels.errors.error ?? "");
    });
  };

  const status = saving
    ? labels.saving
    : value
      ? labels.on
      : reason === "takeover"
        ? labels.offTakeover
        : labels.off;

  return (
    <div className={styles.wrap}>
      <span id={`${id}-label`} className={styles.label}>
        {labels.label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-status`}
        className={styles.switch}
        disabled={disabled}
        aria-busy={saving || undefined}
        onClick={toggle}
      >
        <span className={styles.thumb} aria-hidden="true" />
      </button>
      <span id={`${id}-status`} className={styles.status}>
        {status}
      </span>
      <p className={styles.error} role="alert" hidden={problem === ""}>
        {problem}
      </p>
    </div>
  );
}
