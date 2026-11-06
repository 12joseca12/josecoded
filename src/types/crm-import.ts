import "@/lib/security/zod-jitless";

import { z } from "zod";

import { type ContactKind, contactKinds } from "./crm";

export const importMaxBytes = 1_048_576;
export const importMaxRows = 500;
export const importMaxColumns = 40;
export const importPreviewRows = 20;
export const importFileExtension = ".csv";
export const importAccept = ".csv,text/csv";
export const importTemplateName = "plantilla-contactos.csv";

export const importFields = [
  "fullName",
  "email",
  "phone",
  "organization",
  "kind",
  "notes",
] as const;
export type ImportField = (typeof importFields)[number];

export const importTemplateHeaders = [
  "nombre",
  "email",
  "telefono",
  "empresa",
  "tipo",
  "notas",
] as const;

export const importRejections = [
  "empty",
  "tooLarge",
  "extension",
  "mime",
  "binary",
  "executable",
  "encoding",
  "tooManyRows",
  "tooManyColumns",
  "malformed",
  "noHeader",
  "noFile",
] as const;
export type ImportRejection = (typeof importRejections)[number];

export const importRowProblems = [
  "columns",
  "fullName",
  "email",
  "phone",
  "organization",
  "kind",
  "notes",
  "duplicateInFile",
] as const;
export type ImportRowProblem = (typeof importRowProblems)[number];

export const importDuplicateModes = ["skip", "update"] as const;
export type ImportDuplicateMode = (typeof importDuplicateModes)[number];

export const importMappingSchema = z.strictObject({
  fullName: z.number().int().min(0).max(importMaxColumns).nullable(),
  email: z.number().int().min(0).max(importMaxColumns).nullable(),
  phone: z.number().int().min(0).max(importMaxColumns).nullable(),
  organization: z.number().int().min(0).max(importMaxColumns).nullable(),
  kind: z.number().int().min(0).max(importMaxColumns).nullable(),
  notes: z.number().int().min(0).max(importMaxColumns).nullable(),
});
export type ImportMapping = z.infer<typeof importMappingSchema>;

export const importRowSchema = z.strictObject({
  fullName: z.string().min(1).max(200),
  email: z.union([z.literal(""), z.email().max(320)]),
  phone: z.union([
    z.literal(""),
    z
      .string()
      .max(40)
      .regex(/^[+0-9(][0-9 ().-]*$/),
  ]),
  organization: z.string().max(200),
  kind: z.enum(contactKinds),
  notes: z.string().max(20000),
});
export type ImportRowValues = z.infer<typeof importRowSchema>;

export const importOptionsSchema = z.strictObject({
  mapping: importMappingSchema,
  onDuplicate: z.enum(importDuplicateModes),
  ownerId: z.union([z.literal(""), z.uuid()]),
});

export const importPreviewOptionsSchema = z.strictObject({
  mapping: importMappingSchema.nullable(),
  ownerId: z.union([z.literal(""), z.uuid()]),
});

export type ImportRowVerdict = "ok" | "duplicate" | "invalid";

export interface ImportPreviewRow {
  line: number;
  cells: string[];
  values: ImportRowValues | null;
  verdict: ImportRowVerdict;
  problems: ImportRowProblem[];
  neutralized: boolean;
}

export interface ImportProblemRow {
  line: number;
  cells: string[];
  verdict: Exclude<ImportRowVerdict, "ok">;
  problems: ImportRowProblem[];
}

export interface ImportPreviewData {
  fileName: string;
  fileHash: string;
  headers: string[];
  mapping: ImportMapping;
  totals: {
    rows: number;
    valid: number;
    invalid: number;
    duplicates: number;
    neutralized: number;
  };
  sample: ImportPreviewRow[];
  problems: ImportProblemRow[];
  alreadyImported: boolean;
}

export type ImportPreviewResult =
  | { status: "ready"; data: ImportPreviewData }
  | { status: "rejected"; reason: ImportRejection }
  | { status: "forbidden" }
  | { status: "error" };

export interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  invalid: number;
}

export type ImportCommitResult =
  | { status: "done"; summary: ImportSummary; problems: ImportProblemRow[] }
  | { status: "rejected"; reason: ImportRejection }
  | { status: "alreadyImported" }
  | { status: "missingName" }
  | { status: "forbidden" }
  | { status: "error" };

export type ImportPreviewHandler = (data: FormData) => Promise<ImportPreviewResult>;
export type ImportCommitHandler = (data: FormData) => Promise<ImportCommitResult>;

export interface ImportOwner {
  id: string;
  name: string;
}

export interface ImportHistoryRow {
  id: string;
  fileName: string;
  createdAt: string;
  created: number;
  updated: number;
  skipped: number;
  invalid: number;
}

export interface ImportLabels {
  pick: string;
  pickAgain: string;
  hint: string;
  selected: string;
  checking: string;
  rejections: Record<ImportRejection | "error" | "forbidden", string>;
  templateDownload: string;
  mapping: {
    legend: string;
    hint: string;
    none: string;
    required: string;
    missingName: string;
    fields: Record<ImportField, string>;
  };
  preview: {
    title: string;
    caption: string;
    region: string;
    line: string;
    verdict: string;
    summary: string;
    truncated: string;
    alreadyImported: string;
    verdicts: Record<ImportRowVerdict, string>;
    problems: Record<ImportRowProblem, string>;
    neutralized: string;
  };
  options: {
    legend: string;
    skip: string;
    skipHint: string;
    update: string;
    updateHint: string;
    owner: string;
  };
  confirm: string;
  importing: string;
  cancel: string;
  result: {
    title: string;
    created: string;
    updated: string;
    skipped: string;
    invalid: string;
    report: string;
    again: string;
    contacts: string;
  };
  report: {
    line: string;
    problem: string;
    status: Record<Exclude<ImportRowVerdict, "ok">, string>;
  };
  errors: { missingName: string; alreadyImported: string; failed: string };
}

export interface ImportHistoryLabels {
  title: string;
  caption: string;
  region: string;
  empty: string;
  columns: {
    file: string;
    date: string;
    created: string;
    updated: string;
    skipped: string;
    invalid: string;
  };
}

export function isContactKind(value: string): value is ContactKind {
  return contactKinds.some((kind) => kind === value);
}
