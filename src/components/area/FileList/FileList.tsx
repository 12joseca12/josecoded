"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/admin/users";
import {
  type DocumentErrorCode,
  documentErrorCodes,
  type DocumentRow,
  type FileListLabels,
} from "@/types/project-documents";

import styles from "./FileList.module.css";

interface FileListProps {
  files: DocumentRow[];
  variant: "admin" | "client" | "freelance";
  locale: string;
  labels: FileListLabels;
}

const knownCodes = new Set<string>(documentErrorCodes);
const megabyte = 1024 * 1024;

export function formatSize(bytes: number, locale: string): string {
  const large = bytes >= megabyte;
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: large ? "megabyte" : "kilobyte",
    maximumFractionDigits: 1,
  }).format(large ? bytes / megabyte : Math.max(bytes / 1024, 0.1));
}

export function FileList({ files, variant, locale, labels }: FileListProps) {
  const router = useRouter();
  const announce = useAnnounce();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<DocumentErrorCode | null>(null);

  if (files.length === 0) {
    return <EmptyState headingLevel={3} title={labels.empty.title} text={labels.empty.text} />;
  }

  const remove = (file: DocumentRow) => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      let code: DocumentErrorCode | null;
      try {
        const response = await fetch(`/api/projects/documents?id=${file.id}`, {
          method: "DELETE",
        });
        if (response.ok) code = null;
        else {
          const body = (await response.json()) as { code?: unknown };
          code =
            typeof body.code === "string" && knownCodes.has(body.code)
              ? (body.code as DocumentErrorCode)
              : "error";
        }
      } catch {
        code = "error";
      }
      setConfirming(null);
      if (code === null) {
        announce(labels.deleted.replace("{name}", file.name));
        router.refresh();
      } else {
        setError(code);
      }
    });
  };

  return (
    <div className={styles.wrap} role="region" aria-label={labels.region}>
      <ul className={styles.list}>
        {files.map((file) => {
          const deletable = variant === "admin" || file.uploaded_by_me;
          const meta = [
            formatSize(file.size_bytes, locale),
            formatDay(file.created_at, locale),
          ].join(" · ");
          return (
            <li key={file.id} className={styles.row}>
              <div className={styles.main}>
                <a
                  className={styles.name}
                  href={`/api/projects/documents?id=${file.id}`}
                  aria-label={labels.downloadFor.replace("{name}", file.name)}
                >
                  {file.name}
                </a>
                <p className={styles.meta}>{meta}</p>
              </div>
              {variant === "admin" ? (
                <StatusPill tone={file.visibility === "team" ? "alert" : "neutral"}>
                  {labels.visibility[file.visibility]}
                </StatusPill>
              ) : null}
              {variant !== "admin" && labels.uploader ? (
                <StatusPill tone={file.uploader === "me" ? "done" : "neutral"}>
                  {labels.uploader[file.uploader]}
                </StatusPill>
              ) : null}
              {deletable ? (
                confirming === file.id ? (
                  <div className={styles.confirm} role="group" aria-label={labels.delete}>
                    <p className={styles.meta}>{labels.deleteConfirm}</p>
                    <Button
                      variant="light"
                      size="sm"
                      loading={pending}
                      loadingLabel={labels.deleting}
                      onClick={() => {
                        remove(file);
                      }}
                    >
                      {labels.delete}
                    </Button>
                    <Button
                      variant="quiet"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setConfirming(null);
                      }}
                    >
                      {labels.cancel}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="quiet"
                    size="sm"
                    aria-label={labels.deleteFor.replace("{name}", file.name)}
                    onClick={() => {
                      setError(null);
                      setConfirming(file.id);
                    }}
                  >
                    {labels.delete}
                  </Button>
                )
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className={styles.feedback} role="alert">
        {error === null ? null : labels.errors[error]}
      </p>
    </div>
  );
}
