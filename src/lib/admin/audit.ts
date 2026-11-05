import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  type AuditAction,
  auditActions,
  type AuditChange,
  type AuditEntry,
  type AuditFilters,
  auditMaxLimit,
  auditPageSize,
  type AuditRow,
  auditRowSchema,
  type AuditTable,
  auditTables,
} from "@/types/audit";
import type { Database } from "@/types/database";
import type { SystemSource } from "@/types/system";

import { isMissingObject } from "./system";

export type AuditSearchParams = Record<string, string | string[] | undefined>;

const noisyFields = new Set(["updated_at", "created_at", "last_activity_at"]);
const visibleChanges = 4;
const valueMax = 60;

function single(params: AuditSearchParams, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function member<T extends string>(list: readonly T[], value: string): T | null {
  return (list as readonly string[]).includes(value) ? (value as T) : null;
}

export function parseAuditFilters(params: AuditSearchParams): AuditFilters {
  const raw = Number.parseInt(single(params, "limite"), 10);
  const limit = Number.isFinite(raw) ? raw : auditPageSize;
  return {
    table: member(auditTables, single(params, "tabla")),
    action: member(auditActions, single(params, "accion")),
    limit: Math.min(auditMaxLimit, Math.max(auditPageSize, limit)),
  };
}

export function auditHref(base: string, filters: AuditFilters): string {
  const query = new URLSearchParams();
  if (filters.table) query.set("tabla", filters.table);
  if (filters.action) query.set("accion", filters.action);
  if (filters.limit > auditPageSize) query.set("limite", String(filters.limit));
  const text = query.toString();
  return text === "" ? base : `${base}?${text}`;
}

export function hasAuditFilters(filters: AuditFilters): boolean {
  return filters.table !== null || filters.action !== null;
}

export function nextLimit(limit: number): number {
  return Math.min(auditMaxLimit, limit + auditPageSize);
}

function show(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text =
    typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : JSON.stringify(value);
  return text.length > valueMax ? `${text.slice(0, valueMax)}…` : text;
}

function diff(row: AuditRow): AuditChange[] {
  const before = row.before ?? {};
  const after = row.after ?? {};
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((field) => !noisyFields.has(field))
    .sort();
  const changes: AuditChange[] = [];
  for (const field of fields) {
    const was = show(before[field]);
    const now = show(after[field]);
    if (was !== now) changes.push({ field, before: was, after: now });
  }
  return changes;
}

export function summarizeEntry(row: AuditRow): AuditEntry {
  const base = {
    id: row.id,
    at: row.at,
    actor: row.actor_name,
    table: row.table_name,
    rowId: row.row_id,
  };
  if (row.after?.totp_reset === true) {
    return { ...base, kind: "totp_reset", changes: [], hiddenChanges: 0 };
  }
  const action = member(auditActions, row.action);
  if (action === null) return { ...base, kind: "other", changes: [], hiddenChanges: 0 };
  if (action !== "update") return { ...base, kind: action, changes: [], hiddenChanges: 0 };
  const changes = diff(row);
  return {
    ...base,
    kind: "update",
    changes: changes.slice(0, visibleChanges),
    hiddenChanges: Math.max(0, changes.length - visibleChanges),
  };
}

export function filterByAction(rows: AuditRow[], action: AuditAction | null): AuditRow[] {
  return action === null ? rows : rows.filter((row) => row.action === action);
}

export function isAuditTable(value: string): value is AuditTable {
  return (auditTables as readonly string[]).includes(value);
}

const rowsSchema = z.array(auditRowSchema);

export interface AuditQuery {
  table: AuditTable | null;
  rowId: string | null;
  limit: number;
}

export async function fetchAudit(
  client: SupabaseClient<Database>,
  query: AuditQuery,
): Promise<SystemSource<AuditRow[]>> {
  try {
    const { data, error } = await client.rpc("admin_audit_log", {
      ...(query.table ? { p_table: query.table } : {}),
      ...(query.rowId ? { p_row_id: query.rowId } : {}),
      p_limit: query.limit,
    });
    if (error) return isMissingObject(error) ? { status: "unavailable" } : { status: "error" };
    const rows = rowsSchema.safeParse(data);
    return rows.success ? { status: "ok", data: rows.data } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}
