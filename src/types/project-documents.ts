import "@/lib/security/zod-jitless";

import { z } from "zod";

export const documentVisibilities = ["client", "team"] as const;
export type DocumentVisibility = (typeof documentVisibilities)[number];

export const documentMimes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/zip",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export const documentMaxBytes = 26214400;

export const documentErrorCodes = [
  "invalid_request",
  "file_missing",
  "file_too_large",
  "invalid_mime",
  "invalid_name",
  "project_not_found",
  "not_member",
  "visibility_forbidden",
  "project_quota_exceeded",
  "document_exists",
  "document_not_found",
  "forbidden",
  "storage_failed",
  "unavailable",
  "error",
] as const;
export type DocumentErrorCode = (typeof documentErrorCodes)[number];

export const documentRowSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  uploaded_by: z.uuid().nullable(),
  name: z.string(),
  mime: z.string(),
  size_bytes: z.number(),
  visibility: z.enum(documentVisibilities),
  created_at: z.string(),
});
export type DocumentRow = z.infer<typeof documentRowSchema>;

export const uploadFieldsSchema = z.strictObject({
  projectId: z.uuid(),
  visibility: z.enum(documentVisibilities),
});

export const documentIdSchema = z.uuid();

export type DocumentResponse =
  { status: "done"; id: string } | { status: "error"; code: DocumentErrorCode };

export type DocumentsResult = { status: "ok"; documents: DocumentRow[] } | { status: "error" };

export interface FileListLabels {
  region: string;
  empty: { title: string; text: string };
  download: string;
  downloadFor: string;
  delete: string;
  deleteFor: string;
  deleteConfirm: string;
  deleting: string;
  cancel: string;
  deleted: string;
  visibility: Record<DocumentVisibility, string>;
  errors: Record<DocumentErrorCode, string>;
}

export interface UploaderLabels {
  title: string;
  file: string;
  fileHint: string;
  visibility: string;
  visibilityOptions: Record<DocumentVisibility, string>;
  submit: string;
  submitting: string;
  progress: string;
  done: string;
  errors: Record<DocumentErrorCode, string>;
}
