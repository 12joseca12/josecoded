"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { checkFileMeta, inspectBytes } from "@/lib/crm/csv-import/inspect";
import { parseCsv } from "@/lib/crm/csv-import/parse";
import { errorReportCsv, templateCsv } from "@/lib/crm/csv-import/report";
import {
  type ImportCommitHandler,
  type ImportDuplicateMode,
  type ImportLabels,
  type ImportMapping,
  type ImportOwner,
  type ImportPreviewData,
  type ImportPreviewHandler,
  type ImportProblemRow,
  type ImportRejection,
  type ImportSummary,
  importTemplateName,
} from "@/types/crm-import";

import { CsvDropzone } from "../CsvDropzone/CsvDropzone";
import { ImportOptions } from "../ImportOptions/ImportOptions";
import { ImportPreview } from "../ImportPreview/ImportPreview";
import { ImportResult } from "../ImportResult/ImportResult";
import styles from "./ImportWorkbench.module.css";

interface ImportWorkbenchProps {
  labels: ImportLabels;
  preview: ImportPreviewHandler;
  commit: ImportCommitHandler;
  owners: ImportOwner[] | null;
  selfId: string;
  contactsHref: string;
}

type Problem = ImportRejection | "error" | "forbidden";

interface Finished {
  summary: ImportSummary;
  problems: ImportProblemRow[];
  headers: string[];
}

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function clientCheck(file: File): Promise<ImportRejection | null> {
  const meta = checkFileMeta(file);
  if (meta !== null) return meta;
  const inspected = inspectBytes(new Uint8Array(await file.arrayBuffer()));
  if ("reason" in inspected) return inspected.reason;
  const parsed = parseCsv(inspected.text);
  return parsed.ok ? null : parsed.reason;
}

export function ImportWorkbench({
  labels,
  preview,
  commit,
  owners,
  selfId,
  contactsHref,
}: ImportWorkbenchProps) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ImportPreviewData | null>(null);
  const [mapping, setMapping] = useState<ImportMapping | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [commitProblem, setCommitProblem] = useState<string | null>(null);
  const [mode, setMode] = useState<ImportDuplicateMode>("skip");
  const [ownerId, setOwnerId] = useState(selfId);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [checking, startChecking] = useTransition();
  const [importing, startImporting] = useTransition();
  const latest = useRef(0);

  const reset = () => {
    latest.current += 1;
    setFile(null);
    setData(null);
    setMapping(null);
    setProblem(null);
    setCommitProblem(null);
    setFinished(null);
    setMode("skip");
  };

  const applyPreview = async (
    target: File,
    nextMapping: ImportMapping | null,
    nextOwner: string,
    ticket: number,
  ) => {
    const form = new FormData();
    form.set("file", target);
    form.set(
      "options",
      JSON.stringify({ mapping: nextMapping, ownerId: nextOwner === selfId ? "" : nextOwner }),
    );
    const result = await preview(form);
    if (latest.current !== ticket) return;
    if (result.status === "ready") {
      setData(result.data);
      setMapping(result.data.mapping);
      setProblem(null);
      return;
    }
    setData(null);
    setMapping(null);
    setProblem(result.status === "rejected" ? result.reason : result.status);
  };

  const runPreview = (target: File, nextMapping: ImportMapping | null, nextOwner: string) => {
    latest.current += 1;
    const ticket = latest.current;
    startChecking(() => applyPreview(target, nextMapping, nextOwner, ticket));
  };

  const onFile = (picked: File) => {
    setFinished(null);
    setCommitProblem(null);
    setFile(picked);
    setData(null);
    setMapping(null);
    latest.current += 1;
    const ticket = latest.current;
    startChecking(async () => {
      const rejected = await clientCheck(picked);
      if (latest.current !== ticket) return;
      if (rejected !== null) {
        setProblem(rejected);
        return;
      }
      setProblem(null);
      await applyPreview(picked, null, ownerId, ticket);
    });
  };

  const onConfirm = () => {
    if (!file || !mapping) return;
    if (mapping.fullName === null) {
      setCommitProblem(labels.errors.missingName);
      return;
    }
    setCommitProblem(null);
    startImporting(async () => {
      const form = new FormData();
      form.set("file", file);
      form.set(
        "options",
        JSON.stringify({
          mapping,
          onDuplicate: mode,
          ownerId: ownerId === selfId ? "" : ownerId,
        }),
      );
      const result = await commit(form);
      if (result.status === "done") {
        setFinished({
          summary: result.summary,
          problems: result.problems,
          headers: data?.headers ?? [],
        });
        setData(null);
        setFile(null);
        return;
      }
      if (result.status === "alreadyImported") setCommitProblem(labels.errors.alreadyImported);
      else if (result.status === "missingName") setCommitProblem(labels.errors.missingName);
      else if (result.status === "rejected") setCommitProblem(labels.rejections[result.reason]);
      else if (result.status === "forbidden") setCommitProblem(labels.rejections.forbidden);
      else setCommitProblem(labels.errors.failed);
    });
  };

  const busy = checking || importing;
  const reportLabels = { report: labels.report, problems: labels.preview.problems };

  return (
    <div className={styles.workbench}>
      {finished === null ? (
        <>
          <div className={styles.pickRow}>
            <CsvDropzone
              pickLabel={file ? labels.pickAgain : labels.pick}
              hint={labels.hint}
              busy={checking}
              busyLabel={labels.checking}
              accent={data === null}
              onFile={onFile}
            />
            <Button
              variant="quiet"
              onClick={() => {
                download(importTemplateName, templateCsv());
              }}
            >
              {labels.templateDownload}
            </Button>
          </div>
          {file ? (
            <p className={styles.file}>{labels.selected.replace("{name}", file.name)}</p>
          ) : null}
          {problem !== null ? (
            <p className={styles.problem} role="alert">
              {labels.rejections[problem]}
            </p>
          ) : null}
          {data !== null && mapping !== null ? (
            <>
              <ImportPreview
                data={data}
                mapping={mapping}
                labels={labels}
                busy={busy}
                onMapping={(next) => {
                  setMapping(next);
                  if (file) runPreview(file, next, ownerId);
                }}
              />
              <ImportOptions
                labels={labels}
                mode={mode}
                owners={owners}
                ownerId={ownerId}
                importing={importing}
                disabled={
                  busy ||
                  data.alreadyImported ||
                  mapping.fullName === null ||
                  data.totals.valid + data.totals.duplicates === 0
                }
                problem={commitProblem}
                onMode={setMode}
                onOwner={(next) => {
                  setOwnerId(next);
                  if (file) runPreview(file, mapping, next);
                }}
                onConfirm={onConfirm}
                onCancel={reset}
              />
            </>
          ) : null}
        </>
      ) : (
        <ImportResult
          labels={labels}
          summary={finished.summary}
          hasReport={finished.problems.length > 0}
          contactsHref={contactsHref}
          onReport={() => {
            download(
              "informe-errores.csv",
              errorReportCsv(finished.headers, finished.problems, reportLabels),
            );
          }}
          onAgain={reset}
        />
      )}
    </div>
  );
}
