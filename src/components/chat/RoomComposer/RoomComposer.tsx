"use client";

import {
  type KeyboardEvent,
  type SyntheticEvent,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/Button/Button";
import { roomBodyMax, type RoomLabels, type SendRoomMessageResult } from "@/types/room";

import styles from "./RoomComposer.module.css";

export type ComposerMode = "open" | "readOnly" | "archived";

interface RoomComposerProps {
  mode: ComposerMode;
  labels: RoomLabels;
  onSend: (body: string) => Promise<SendRoomMessageResult>;
}

export function RoomComposer({ mode, labels, onSend }: RoomComposerProps) {
  const id = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [problem, setProblem] = useState("");
  const [sending, startSending] = useTransition();

  if (mode !== "open") {
    return (
      <p className={styles.notice} role="status">
        {mode === "archived" ? labels.archived : labels.readOnly}
      </p>
    );
  }

  const submit = () => {
    const body = value.trim();
    if (sending || body === "") return;
    setProblem("");
    startSending(async () => {
      const result = await onSend(body);
      if (result.status === "done") {
        setValue("");
        area.current?.focus();
        return;
      }
      setProblem(labels.errors[result.problem]);
    });
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  const counter = labels.count
    .replace("{used}", String(value.length))
    .replace("{max}", String(roomBodyMax));

  return (
    <form className={styles.composer} onSubmit={onSubmit} noValidate>
      <label htmlFor={id} className={styles.label}>
        {labels.composerLabel}
      </label>
      <div className={styles.row}>
        <textarea
          ref={area}
          id={id}
          name="body"
          className={styles.input}
          rows={2}
          maxLength={roomBodyMax}
          placeholder={labels.placeholder}
          value={value}
          aria-invalid={problem === "" ? undefined : true}
          aria-describedby={`${id}-help`}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          onKeyDown={onKeyDown}
        />
        <Button
          type="submit"
          variant="primary"
          loading={sending}
          loadingLabel={labels.sending}
          disabled={value.trim() === ""}
        >
          {labels.send}
        </Button>
      </div>
      <p id={`${id}-help`} className={styles.help}>
        {counter}
      </p>
      <p className={styles.error} role="alert" hidden={problem === ""}>
        {problem}
      </p>
    </form>
  );
}
