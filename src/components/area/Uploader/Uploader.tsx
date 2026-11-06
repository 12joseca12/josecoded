"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useId, useRef, useState } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import {
  type DocumentErrorCode,
  documentErrorCodes,
  documentMaxBytes,
  documentMimes,
  documentVisibilities,
  type DocumentVisibility,
  type UploaderLabels,
} from "@/types/project-documents";

import styles from "./Uploader.module.css";

interface UploaderProps {
  projectId: string;
  variant: "admin" | "client";
  labels: UploaderLabels;
}

const knownCodes = new Set<string>(documentErrorCodes);
const allowedMimes = new Set<string>(documentMimes);

function codeOf(body: unknown): DocumentErrorCode {
  const code = typeof body === "object" && body !== null && "code" in body ? body.code : null;
  return typeof code === "string" && knownCodes.has(code) ? (code as DocumentErrorCode) : "error";
}

export function Uploader({ projectId, variant, labels }: UploaderProps) {
  const router = useRouter();
  const announce = useAnnounce();
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [visibility, setVisibility] = useState<DocumentVisibility>("client");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<DocumentErrorCode | null>(null);
  const pending = progress !== null;
  const percent = progress === null ? "" : [progress, "%"].join(" ");

  const fail = (code: DocumentErrorCode) => {
    setProgress(null);
    setError(code);
    input.current?.focus();
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    const file = input.current?.files?.[0];
    if (file === undefined) {
      fail("file_missing");
      return;
    }
    if (file.size > documentMaxBytes) {
      fail("file_too_large");
      return;
    }
    if (!allowedMimes.has(file.type)) {
      fail("invalid_mime");
      return;
    }

    const body = new FormData();
    body.set("projectId", projectId);
    body.set("visibility", variant === "admin" ? visibility : "client");
    body.set("file", file);
    const request = new XMLHttpRequest();
    request.open("POST", "/api/projects/documents");
    request.upload.onprogress = (progressEvent) => {
      if (progressEvent.lengthComputable) {
        setProgress(Math.round((100 * progressEvent.loaded) / progressEvent.total));
      }
    };
    request.onerror = () => {
      fail("error");
    };
    request.onload = () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(request.responseText);
      } catch {
        parsed = null;
      }
      if (request.status === 201) {
        setProgress(null);
        form.current?.reset();
        announce(labels.done);
        router.refresh();
        return;
      }
      fail(codeOf(parsed));
    };
    setProgress(0);
    request.send(body);
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} ref={form} noValidate>
      <h3 className={styles.title}>{labels.title}</h3>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${hintId}-file`}>
          {labels.file}
        </label>
        <p className={styles.hint} id={hintId}>
          {labels.fileHint}
        </p>
        <input
          id={`${hintId}-file`}
          ref={input}
          className={styles.input}
          type="file"
          name="file"
          accept={documentMimes.join(",")}
          disabled={pending}
          aria-describedby={hintId}
          aria-invalid={error === null ? undefined : true}
        />
      </div>
      {variant === "admin" ? (
        <Field
          control="select"
          name="visibility"
          label={labels.visibility}
          value={visibility}
          onChange={(event) => {
            setVisibility(event.currentTarget.value as DocumentVisibility);
          }}
          disabled={pending}
        >
          {documentVisibilities.map((option) => (
            <option key={option} value={option}>
              {labels.visibilityOptions[option]}
            </option>
          ))}
        </Field>
      ) : null}
      <div className={styles.actions}>
        <Button type="submit" variant="light" loading={pending} loadingLabel={labels.submitting}>
          {labels.submit}
        </Button>
        {pending ? (
          <div className={styles.progress}>
            <progress
              className={styles.bar}
              value={progress}
              max={100}
              aria-label={labels.progress}
            />
            <span className={styles.percent}>{percent}</span>
          </div>
        ) : null}
      </div>
      <p className={styles.feedback} role="alert">
        {error === null ? null : labels.errors[error]}
      </p>
    </form>
  );
}
