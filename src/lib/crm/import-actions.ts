import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { UserRole } from "@/types/auth";
import {
  type ImportCommitResult,
  importOptionsSchema,
  importPreviewOptionsSchema,
  type ImportPreviewResult,
  type ImportRejection,
} from "@/types/crm-import";
import type { Database } from "@/types/database";

import { checkFileMeta, inspectBytes } from "./csv-import/inspect";
import { parseCsv, type ParsedCsv } from "./csv-import/parse";
import { classify, emailsOf, evaluateFile, samplePreview, suggestMapping } from "./csv-import/rows";

export interface ImportMember {
  userId: string;
  role: UserRole;
}

interface Upload {
  fileName: string;
  fileHash: string;
  csv: ParsedCsv;
}

const insufficientPrivilege = "42501";
const emailChunk = 100;
const hashPattern = /^[0-9a-f]{64}$/;

const summarySchema = z.object({
  created: z.number().int().min(0),
  updated: z.number().int().min(0),
  skipped: z.number().int().min(0),
  invalid: z.number().int().min(0),
});

function textOf(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

function jsonOf(data: FormData, name: string): unknown {
  try {
    return JSON.parse(textOf(data, name));
  } catch {
    return null;
  }
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readUpload(data: FormData): Promise<Upload | ImportRejection> {
  const file = data.get("file");
  if (!(file instanceof File)) return "noFile";
  const rejected = checkFileMeta(file);
  if (rejected !== null) return rejected;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const inspected = inspectBytes(bytes);
  if ("reason" in inspected) return inspected.reason;
  const parsed = parseCsv(inspected.text);
  if (!parsed.ok) return parsed.reason;
  const fileHash = await sha256(bytes);
  if (!hashPattern.test(fileHash)) return "binary";
  return { fileName: file.name.slice(0, 255), fileHash, csv: parsed.csv };
}

function ownerOf(member: ImportMember, ownerId: string): string | null {
  if (ownerId === "" || ownerId === member.userId) return member.userId;
  return member.role === "admin" ? ownerId : null;
}

async function existingEmails(
  client: SupabaseClient<Database>,
  ownerId: string,
  emails: readonly string[],
): Promise<Set<string> | null> {
  const found = new Set<string>();
  for (let start = 0; start < emails.length; start += emailChunk) {
    const { data, error } = await client
      .from("contacts")
      .select("email")
      .eq("owner_id", ownerId)
      .is("archived_at", null)
      .in("email", emails.slice(start, start + emailChunk));
    if (error) return null;
    for (const row of data) if (row.email) found.add(row.email.toLowerCase());
  }
  return found;
}

async function alreadyImported(
  client: SupabaseClient<Database>,
  userId: string,
  fileHash: string,
): Promise<boolean | null> {
  const { data, error } = await client
    .from("imports")
    .select("rows_created, rows_updated")
    .eq("owner_id", userId)
    .eq("file_hash", fileHash);
  if (error) return null;
  return data.some((row) => row.rows_created + row.rows_updated > 0);
}

export async function previewImport(
  client: SupabaseClient<Database>,
  member: ImportMember,
  data: FormData,
): Promise<ImportPreviewResult> {
  const options = importPreviewOptionsSchema.safeParse(jsonOf(data, "options"));
  if (!options.success) return { status: "error" };
  const ownerId = ownerOf(member, options.data.ownerId);
  if (ownerId === null) return { status: "forbidden" };
  try {
    const upload = await readUpload(data);
    if (typeof upload === "string") return { status: "rejected", reason: upload };
    const mapping = options.data.mapping ?? suggestMapping(upload.csv.headers);
    const evaluated = evaluateFile(upload.csv, mapping);
    const existing = await existingEmails(client, ownerId, emailsOf(evaluated.rows));
    const imported = await alreadyImported(client, member.userId, upload.fileHash);
    if (existing === null || imported === null) return { status: "error" };
    const classified = classify(evaluated, existing);
    return {
      status: "ready",
      data: {
        fileName: upload.fileName,
        fileHash: upload.fileHash,
        headers: upload.csv.headers,
        mapping,
        totals: classified.totals,
        sample: samplePreview(classified.preview),
        problems: classified.problems,
        alreadyImported: imported,
      },
    };
  } catch {
    return { status: "error" };
  }
}

export async function commitImport(
  client: SupabaseClient<Database>,
  member: ImportMember,
  data: FormData,
): Promise<ImportCommitResult> {
  const options = importOptionsSchema.safeParse(jsonOf(data, "options"));
  if (!options.success) return { status: "error" };
  const ownerId = ownerOf(member, options.data.ownerId);
  if (ownerId === null) return { status: "forbidden" };
  if (options.data.mapping.fullName === null) return { status: "missingName" };
  try {
    const upload = await readUpload(data);
    if (typeof upload === "string") return { status: "rejected", reason: upload };
    const evaluated = evaluateFile(upload.csv, options.data.mapping);
    const classified = classify(evaluated, new Set());
    const fileDuplicates = classified.problems.filter((row) => row.verdict === "duplicate").length;
    const base = {
      created: 0,
      updated: 0,
      skipped: fileDuplicates,
      invalid: classified.totals.invalid,
    };
    if (classified.importable.length === 0) {
      return { status: "done", summary: base, problems: classified.problems };
    }
    const { data: result, error } = await client.rpc("import_contacts", {
      p_file_name: upload.fileName,
      p_file_hash: upload.fileHash,
      p_rows: classified.importable.map((row) => ({
        full_name: row.fullName,
        email: row.email,
        phone: row.phone,
        organization: row.organization,
        kind: row.kind,
        notes: row.notes,
      })),
      p_on_duplicate: options.data.onDuplicate,
      p_owner_id: ownerId,
    });
    if (error) {
      if (error.message.includes("already_imported")) return { status: "alreadyImported" };
      if (error.code === insufficientPrivilege) return { status: "forbidden" };
      return { status: "error" };
    }
    const summary = summarySchema.safeParse(result);
    if (!summary.success) return { status: "error" };
    return {
      status: "done",
      summary: {
        created: summary.data.created,
        updated: summary.data.updated,
        skipped: base.skipped + summary.data.skipped,
        invalid: base.invalid + summary.data.invalid,
      },
      problems: classified.problems,
    };
  } catch {
    return { status: "error" };
  }
}
