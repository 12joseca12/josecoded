import "@/lib/security/zod-jitless";

import { z } from "zod";

export const auditTables = ["contacts", "deals", "invitations", "leads", "profiles"] as const;
export type AuditTable = (typeof auditTables)[number];

export const auditActions = ["insert", "update", "delete"] as const;
export type AuditAction = (typeof auditActions)[number];

export const auditPageSize = 50;
export const auditMaxLimit = 200;

export const auditRowSchema = z.object({
  id: z.number(),
  at: z.string(),
  actor_name: z.string().nullable(),
  table_name: z.string(),
  row_id: z.string().nullable(),
  action: z.string(),
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
});

export type AuditRow = z.infer<typeof auditRowSchema>;

export interface AuditChange {
  field: string;
  before: string | null;
  after: string | null;
}

export type AuditKind = AuditAction | "totp_reset" | "other";

export interface AuditEntry {
  id: number;
  at: string;
  actor: string | null;
  table: string;
  rowId: string | null;
  kind: AuditKind;
  changes: AuditChange[];
  hiddenChanges: number;
}

export interface AuditFilters {
  table: AuditTable | null;
  action: AuditAction | null;
  limit: number;
}

export interface AuditListLabels {
  region: string;
  tables: Record<AuditTable, string>;
  kinds: Record<AuditKind, string>;
  system: string;
  noChanges: string;
  emptyValue: string;
  record: string;
  moreChanges: string;
}
