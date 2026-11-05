"use client";

import { useId, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/Button/Button";
import { CopyIcon } from "@/components/ui/icons/CopyIcon";

import styles from "./InviteLink.module.css";

interface InviteLinkProps {
  path: string;
  label: string;
  copyLabel: string;
  copiedLabel: string;
}

const subscribe = () => () => undefined;
const readOrigin = () => window.location.origin;
const readServerOrigin = () => "";

export function InviteLink({ path, label, copyLabel, copiedLabel }: InviteLinkProps) {
  const id = useId();
  const origin = useSyncExternalStore(subscribe, readOrigin, readServerOrigin);
  const [copied, setCopied] = useState(false);
  const url = `${origin}${path}`;

  const copy = () => {
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
      },
      () => {
        setCopied(false);
      },
    );
  };

  return (
    <div className={styles.link}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.row}>
        <input
          id={id}
          className={styles.input}
          type="text"
          readOnly
          value={url}
          onFocus={(event) => {
            event.currentTarget.select();
          }}
        />
        <Button variant="light" size="sm" icon={<CopyIcon />} onClick={copy}>
          {copyLabel}
        </Button>
      </div>
      <p className={styles.status} role="status">
        {copied ? copiedLabel : ""}
      </p>
    </div>
  );
}
