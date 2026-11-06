"use client";

import { type DragEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { importAccept } from "@/types/crm-import";

import styles from "./CsvDropzone.module.css";

interface CsvDropzoneProps {
  pickLabel: string;
  hint: string;
  busy: boolean;
  busyLabel: string;
  accent: boolean;
  onFile: (file: File) => void;
}

export function CsvDropzone({
  pickLabel,
  hint,
  busy,
  busyLabel,
  accent,
  onFile,
}: CsvDropzoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = event.dataTransfer.files.item(0);
    if (file) onFile(file);
  };

  return (
    <div
      className={styles.zone}
      data-dragging={dragging || undefined}
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={() => {
        setDragging(false);
      }}
      onDrop={onDrop}
    >
      <input
        ref={input}
        type="file"
        accept={importAccept}
        hidden
        data-testid="csv-input"
        onChange={(event) => {
          const file = event.currentTarget.files?.item(0);
          event.currentTarget.value = "";
          if (file) onFile(file);
        }}
      />
      <Button
        variant={accent ? "accent" : "ghost"}
        loading={busy}
        loadingLabel={busyLabel}
        onClick={() => {
          input.current?.click();
        }}
      >
        {pickLabel}
      </Button>
      <p className={styles.hint}>{hint}</p>
    </div>
  );
}
