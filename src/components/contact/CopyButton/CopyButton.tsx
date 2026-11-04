"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { CopyIcon } from "@/components/ui/icons/CopyIcon";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";

import styles from "./CopyButton.module.css";

interface CopyButtonProps {
  value: string;
  label: string;
  ariaLabel: string;
  doneLabel: string;
}

const doneMs = 2000;

export function CopyButton({ value, label, ariaLabel, doneLabel }: CopyButtonProps) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    setDone(true);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDone(false);
    }, doneMs);
  };

  return (
    <span className={styles.wrap}>
      <Button
        variant="quiet"
        size="sm"
        icon={<CopyIcon />}
        aria-label={ariaLabel}
        data-copy=""
        data-done={done || undefined}
        onClick={() => {
          void copy();
        }}
      >
        {done ? doneLabel : label}
      </Button>
      <VisuallyHidden>
        <span role="status">{done ? doneLabel : ""}</span>
      </VisuallyHidden>
    </span>
  );
}
