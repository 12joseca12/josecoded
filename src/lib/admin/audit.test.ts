import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { AuditRow } from "@/types/audit";
import type { Database } from "@/types/database";

import {
  auditHref,
  fetchAudit,
  filterByAction,
  hasAuditFilters,
  nextLimit,
  parseAuditFilters,
  summarizeEntry,
} from "./audit";

function row(overrides: Partial<AuditRow>): AuditRow {
  return {
    id: 1,
    at: "2026-11-05T10:00:00+00:00",
    actor_name: "Jose",
    table_name: "leads",
    row_id: "00000000-0000-4000-8000-000000000001",
    action: "update",
    before: null,
    after: null,
    ...overrides,
  };
}

function clientWith(result: { data: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

describe("parseAuditFilters", () => {
  it("accepts known tables and actions and clamps the limit", () => {
    expect(parseAuditFilters({ tabla: "leads", accion: "update", limite: "100" })).toEqual({
      table: "leads",
      action: "update",
      limit: 100,
    });
    expect(parseAuditFilters({ limite: "9999" }).limit).toBe(200);
    expect(parseAuditFilters({ limite: "-4" }).limit).toBe(50);
    expect(parseAuditFilters({ limite: "abc" }).limit).toBe(50);
  });

  it("ignores unknown values and takes the first of repeated params", () => {
    expect(parseAuditFilters({ tabla: "auth_users", accion: "drop" })).toEqual({
      table: null,
      action: null,
      limit: 50,
    });
    expect(parseAuditFilters({ tabla: ["deals", "leads"] }).table).toBe("deals");
  });
});

describe("auditHref and limits", () => {
  it("writes only what differs from the default", () => {
    expect(auditHref("/a", { table: null, action: null, limit: 50 })).toBe("/a");
    expect(auditHref("/a", { table: "deals", action: "delete", limit: 150 })).toBe(
      "/a?tabla=deals&accion=delete&limite=150",
    );
  });

  it("detects filters and caps the next page", () => {
    expect(hasAuditFilters({ table: null, action: null, limit: 150 })).toBe(false);
    expect(hasAuditFilters({ table: "leads", action: null, limit: 50 })).toBe(true);
    expect(nextLimit(50)).toBe(100);
    expect(nextLimit(200)).toBe(200);
  });
});

describe("summarizeEntry", () => {
  it("lists the changed fields and skips timestamps", () => {
    const entry = summarizeEntry(
      row({
        before: { status: "new", assigned_to: null, updated_at: "a" },
        after: { status: "assigned", assigned_to: "x", updated_at: "b" },
      }),
    );
    expect(entry.kind).toBe("update");
    expect(entry.changes).toEqual([
      { field: "assigned_to", before: null, after: "x" },
      { field: "status", before: "new", after: "assigned" },
    ]);
  });

  it("truncates long values and caps the visible fields", () => {
    const after = Object.fromEntries(
      ["a", "b", "c", "d", "e", "f"].map((key) => [key, "x".repeat(80)]),
    );
    const entry = summarizeEntry(row({ before: {}, after }));
    expect(entry.changes).toHaveLength(4);
    expect(entry.hiddenChanges).toBe(2);
    expect(entry.changes[0]?.after).toHaveLength(61);
  });

  it("recognises inserts, deletes, authenticator resets and unknown actions", () => {
    expect(summarizeEntry(row({ action: "insert" })).kind).toBe("insert");
    expect(summarizeEntry(row({ action: "delete" })).kind).toBe("delete");
    expect(summarizeEntry(row({ after: { totp_reset: true } })).kind).toBe("totp_reset");
    expect(summarizeEntry(row({ action: "truncate" })).kind).toBe("other");
  });
});

describe("filterByAction", () => {
  it("keeps everything without an action", () => {
    const rows = [row({ id: 1, action: "insert" }), row({ id: 2, action: "update" })];
    expect(filterByAction(rows, null)).toHaveLength(2);
    expect(filterByAction(rows, "update").map((entry) => entry.id)).toEqual([2]);
  });
});

describe("fetchAudit", () => {
  it("sends only the filters that are set", async () => {
    const { client, rpc } = clientWith({ data: [], error: null });
    await fetchAudit(client, { table: null, rowId: null, limit: 10 });
    expect(rpc).toHaveBeenCalledWith("admin_audit_log", { p_limit: 10 });
    await fetchAudit(client, { table: "leads", rowId: "r", limit: 5 });
    expect(rpc).toHaveBeenLastCalledWith("admin_audit_log", {
      p_table: "leads",
      p_row_id: "r",
      p_limit: 5,
    });
  });

  it("parses rows, and tells a missing function from a failure", async () => {
    const ok = await fetchAudit(clientWith({ data: [row({})], error: null }).client, {
      table: null,
      rowId: null,
      limit: 10,
    });
    expect(ok.status).toBe("ok");
    const missing = await fetchAudit(
      clientWith({ data: null, error: { code: "PGRST202", message: "x" } }).client,
      { table: null, rowId: null, limit: 10 },
    );
    expect(missing.status).toBe("unavailable");
    const failed = await fetchAudit(
      clientWith({ data: null, error: { code: "XX000", message: "x" } }).client,
      { table: null, rowId: null, limit: 10 },
    );
    expect(failed.status).toBe("error");
    const malformed = await fetchAudit(clientWith({ data: [{ id: "x" }], error: null }).client, {
      table: null,
      rowId: null,
      limit: 10,
    });
    expect(malformed.status).toBe("error");
  });
});
