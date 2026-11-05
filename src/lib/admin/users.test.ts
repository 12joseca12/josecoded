import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  fetchUsers,
  formatEuro,
  formatRate,
  invitationStatus,
  previewCommission,
  readRate,
} from "./users";

const id = "00000000-0000-4000-8000-0000000000c1";
const now = new Date("2026-11-05T10:00:00Z");

const userRow = {
  id,
  email: "closer@example.com",
  full_name: "Cleo Closer",
  role: "closer",
  is_active: true,
  archived_at: null,
  parent_closer_id: null,
  closer_rate: 10,
  parent_rate: null,
  closer_recurring_rate: 5,
  parent_recurring_rate: null,
  payout_cadence: "biweekly",
  has_totp: true,
  contacts_count: 2,
  open_deals: 1,
  accrued_pending: 0,
};

const invitationRow = {
  id: "50000000-0000-4000-8000-000000000001",
  email: "nueva@example.com",
  role: "closer",
  invited_by: id,
  expires_at: "2026-11-10T10:00:00Z",
  accepted_at: null,
  revoked_at: null,
  created_at: "2026-11-03T10:00:00Z",
  parent_closer_id: null,
};

function clientWith(users: unknown, invitations: unknown, failure = false) {
  const query = {
    select: () => query,
    order: () => query,
    limit: () => Promise.resolve({ data: invitations, error: failure ? { message: "x" } : null }),
  };
  return {
    rpc: vi.fn(() => Promise.resolve({ data: users, error: null })),
    from: vi.fn(() => query),
  } as unknown as SupabaseClient<Database>;
}

describe("fetchUsers", () => {
  it("returns the validated rows", async () => {
    const result = await fetchUsers(clientWith([userRow], [invitationRow]));
    expect(result).toEqual({ status: "ok", users: [userRow], invitations: [invitationRow] });
  });

  it("fails on query errors, malformed rows and thrown errors", async () => {
    expect(await fetchUsers(clientWith([userRow], [], true))).toEqual({ status: "error" });
    expect(await fetchUsers(clientWith([{ ...userRow, role: "root" }], []))).toEqual({
      status: "error",
    });
    const broken = {
      rpc: () => Promise.reject(new Error("down")),
      from: () => ({
        select: () => ({
          order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;
    expect(await fetchUsers(broken)).toEqual({ status: "error" });
  });
});

describe("invitationStatus", () => {
  it("resolves in order accepted, revoked, expired, pending", () => {
    const base = { accepted_at: null, revoked_at: null, expires_at: "2026-11-10T10:00:00Z" };
    expect(invitationStatus(base, now)).toBe("pending");
    expect(invitationStatus({ ...base, expires_at: "2026-11-05T10:00:00Z" }, now)).toBe("expired");
    expect(invitationStatus({ ...base, revoked_at: "2026-11-04T10:00:00Z" }, now)).toBe("revoked");
    expect(
      invitationStatus(
        { ...base, accepted_at: "2026-11-04T10:00:00Z", revoked_at: "2026-11-04T11:00:00Z" },
        now,
      ),
    ).toBe("accepted");
  });
});

describe("previewCommission", () => {
  it("computes project and recurring amounts for a closer", () => {
    expect(
      previewCommission(1000, {
        closer: 10,
        parent: null,
        closerRecurring: 5,
        parentRecurring: null,
      }),
    ).toEqual({
      project: { closer: 100, parent: null },
      recurring: { closer: 50, parent: null },
    });
  });

  it("adds the parent share and skips what is empty", () => {
    expect(
      previewCommission(1000, { closer: 10, parent: 5, closerRecurring: null, parentRecurring: 2 }),
    ).toEqual({ project: { closer: 100, parent: 50 }, recurring: null });
    expect(
      previewCommission(1000, {
        closer: null,
        parent: 5,
        closerRecurring: null,
        parentRecurring: null,
      }),
    ).toEqual({ project: null, recurring: null });
  });

  it("rounds to cents", () => {
    expect(
      previewCommission(1000, {
        closer: 12.345,
        parent: null,
        closerRecurring: null,
        parentRecurring: null,
      }).project,
    ).toEqual({ closer: 123.45, parent: null });
  });
});

describe("readRate", () => {
  it("accepts percentages with a comma or a dot", () => {
    expect(readRate("10")).toBe(10);
    expect(readRate(" 7,5 ")).toBe(7.5);
    expect(readRate("100")).toBe(100);
    expect(readRate("0")).toBe(0);
  });

  it("rejects empty, malformed and out of range values", () => {
    for (const value of ["", "abc", "101", "-1", "1.234", "1e2"]) {
      expect(readRate(value)).toBeNull();
    }
  });
});

describe("formatters", () => {
  it("formats euros and rates by locale", () => {
    expect(formatEuro(100, "es").replace(/\s/g, " ")).toBe("100 €");
    expect(formatEuro(12.5, "en")).toBe("€12.50");
    expect(formatRate(7.5, "es")?.replace(/\s/g, " ")).toBe("7,5 %");
    expect(formatRate(null, "es")).toBeNull();
  });
});
