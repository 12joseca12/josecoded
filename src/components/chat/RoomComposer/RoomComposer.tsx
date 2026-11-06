"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  type SyntheticEvent,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/Button/Button";
import { attachmentAccept, formatSize, validateFiles } from "@/lib/chat/attachments";
import {
  type AttachmentLabels,
  roomBodyMax,
  type RoomLabels,
  type RoomProblem,
  type SendProgress,
  type SendRoomMessageResult,
} from "@/types/room";

import styles from "./RoomComposer.module.css";

export type ComposerMode = "open" | "readOnly" | "archived";

interface RoomComposerProps {
  mode: ComposerMode;
  labels: RoomLabels;
  allowFiles?: boolean;
  onSend: (
    body: string,
    files?: File[],
    onProgress?: SendProgress,
  ) => Promise<SendRoomMessageResult>;
}

const fileProblems: readonly RoomProblem[] = ["too_many", "too_large", "type", "invalid"];

export function RoomComposer({ mode, labels, allowFiles = false, onSend }: RoomComposerProps) {
  const id = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [problem, setProblem] = useState("");
  const [sending, startSending] = useTransition();

  if (mode !== "open") {
    return (
      <p className={styles.notice} role="status">
        {mode === "archived" ? labels.archived : labels.readOnly}
      </p>
    );
  }

  const ready = value.trim() !== "" || files.length > 0;

  const submit = () => {
    const body = value.trim();
    if (sending || !ready) return;
    setProblem("");
    setProgress(files.length > 0 ? 0 : null);
    startSending(async () => {
      const result = await onSend(body, files.length > 0 ? files : undefined, setProgress);
      setProgress(null);
      if (result.status === "done") {
        setValue("");
        setFiles([]);
        area.current?.focus();
        return;
      }
      if (result.problem === "attachments_failed") {
        setValue("");
        setFiles([]);
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

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = [...(event.target.files ?? [])];
    event.target.value = "";
    if (picked.length === 0) return;
    const next = [...files, ...picked];
    const invalid = validateFiles(next);
    if (invalid !== null && fileProblems.includes(invalid)) {
      setProblem(labels.errors[invalid]);
      return;
    }
    setProblem("");
    setFiles(next);
  };

  const counter = labels.count
    .replace("{used}", String(value.length))
    .replace("{max}", String(roomBodyMax));
  const attach: AttachmentLabels = labels.attachments;

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
          disabled={!ready}
        >
          {labels.send}
        </Button>
      </div>
      {allowFiles ? (
        <div className={styles.files}>
          <input
            ref={picker}
            type="file"
            multiple
            hidden
            tabIndex={-1}
            accept={attachmentAccept}
            onChange={onPick}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={sending}
            onClick={() => picker.current?.click()}
          >
            {attach.attach}
          </Button>
          {files.length > 0 ? (
            <ul className={styles.chosen} aria-label={attach.selected}>
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className={styles.file}>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileSize}>{formatSize(file.size, attach)}</span>
                  <Button
                    type="button"
                    variant="quiet"
                    size="sm"
                    disabled={sending}
                    aria-label={attach.removeAria.replace("{name}", file.name)}
                    onClick={() => {
                      setFiles(files.filter((_, position) => position !== index));
                    }}
                  >
                    {attach.remove}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          {progress === null ? null : (
            <progress
              className={styles.progress}
              max={1}
              value={progress}
              aria-label={attach.progress}
            />
          )}
        </div>
      ) : null}
      <p id={`${id}-help`} className={styles.help}>
        {allowFiles ? `${attach.hint} ` : ""}
        {counter}
      </p>
      <p className={styles.error} role="alert" hidden={problem === ""}>
        {problem}
      </p>
    </form>
  );
}
