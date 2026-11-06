import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import {
  type DocumentErrorCode,
  documentErrorCodes,
  documentIdSchema,
  documentMaxBytes,
  documentMimes,
  type DocumentResponse,
  documentRowSchema,
  type DocumentsResult,
  uploadFieldsSchema,
} from "@/types/project-documents";

export const documentsBucket = "project-documents";
export const signedUrlSeconds = 60;

export interface DocumentDeps {
  client: SupabaseClient<Database>;
  service: SupabaseClient<Database>;
  userId: string;
  newId?: () => string;
}

export interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

const knownCodes = new Set<string>(documentErrorCodes);
const mimes = new Set<string>(documentMimes);

export function mapDocumentError(error: RpcFailure): DocumentErrorCode {
  const message = error.message ?? "";
  if (knownCodes.has(message)) return message as DocumentErrorCode;
  if (error.code === "42501") return "forbidden";
  return "error";
}

export function statusOf(code: DocumentErrorCode): number {
  switch (code) {
    case "invalid_request":
    case "file_missing":
    case "file_too_large":
    case "invalid_mime":
    case "invalid_name":
    case "visibility_forbidden":
      return 400;
    case "forbidden":
    case "not_member":
      return 403;
    case "project_not_found":
    case "document_not_found":
      return 404;
    case "project_quota_exceeded":
    case "document_exists":
      return 409;
    case "storage_failed":
      return 502;
    case "unavailable":
      return 503;
    case "error":
      return 500;
  }
}

export function pathFor(projectId: string, documentId: string): string {
  return `projects/${projectId}/${documentId}`;
}

const columns = "id, project_id, uploaded_by, name, mime, size_bytes, visibility, created_at";
const documentsSchema = z.array(documentRowSchema);

export async function fetchProjectDocuments(
  client: SupabaseClient<Database>,
  projectId: string,
): Promise<DocumentsResult> {
  try {
    const { data, error } = await client
      .from("documents")
      .select(columns)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) return { status: "error" };
    const parsed = documentsSchema.safeParse(data);
    return parsed.success ? { status: "ok", documents: parsed.data } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

function failure(code: DocumentErrorCode): { status: "error"; code: DocumentErrorCode } {
  return { status: "error", code };
}

export async function uploadProjectDocument(
  deps: DocumentDeps,
  form: FormData,
): Promise<DocumentResponse> {
  const fields = uploadFieldsSchema.safeParse({
    projectId: form.get("projectId"),
    visibility: form.get("visibility") ?? "client",
  });
  if (!fields.success) return failure("invalid_request");
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return failure("file_missing");
  if (file.size > documentMaxBytes) return failure("file_too_large");
  if (!mimes.has(file.type)) return failure("invalid_mime");
  const name = file.name.trim();
  if (name === "" || name.length > 255) return failure("invalid_name");

  const { projectId, visibility } = fields.data;
  try {
    const visible = await deps.client.from("project_overview").select("id").eq("id", projectId);
    if (visible.error) return failure("error");
    if (visible.data.length === 0) return failure("project_not_found");

    const id = (deps.newId ?? (() => crypto.randomUUID()))();
    const path = pathFor(projectId, id);
    const stored = await deps.service.storage
      .from(documentsBucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (stored.error) return failure("storage_failed");

    const { error } = await deps.service.rpc("register_document", {
      p_project_id: projectId,
      p_uploaded_by: deps.userId,
      p_name: name,
      p_mime: file.type,
      p_size: file.size,
      p_path: path,
      p_visibility: visibility,
    });
    if (error) {
      await deps.service.storage.from(documentsBucket).remove([path]);
      return failure(mapDocumentError(error));
    }
    return { status: "done", id };
  } catch {
    return failure("error");
  }
}

export async function deleteProjectDocument(
  deps: DocumentDeps,
  rawId: string | null,
): Promise<DocumentResponse> {
  const id = documentIdSchema.safeParse(rawId);
  if (!id.success) return failure("invalid_request");
  try {
    const { data, error } = await deps.client.rpc("delete_document", { p_id: id.data });
    if (error) return failure(mapDocumentError(error));
    if (typeof data === "string") {
      await deps.service.storage.from(documentsBucket).remove([data]);
    }
    return { status: "done", id: id.data };
  } catch {
    return failure("error");
  }
}

export async function signProjectDocument(
  deps: DocumentDeps,
  rawId: string | null,
): Promise<{ status: "done"; url: string } | { status: "error"; code: DocumentErrorCode }> {
  const id = documentIdSchema.safeParse(rawId);
  if (!id.success) return failure("invalid_request");
  try {
    const found = await deps.client
      .from("documents")
      .select("storage_path, name")
      .eq("id", id.data);
    if (found.error) return failure("error");
    const [row] = found.data;
    if (row === undefined) return failure("document_not_found");
    const signed = await deps.service.storage
      .from(documentsBucket)
      .createSignedUrl(row.storage_path, signedUrlSeconds, { download: row.name });
    if (signed.error) return failure("storage_failed");
    return { status: "done", url: signed.data.signedUrl };
  } catch {
    return failure("error");
  }
}
