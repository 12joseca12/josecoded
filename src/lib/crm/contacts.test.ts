import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { DealSummary } from "@/types/crm";
import type { Database } from "@/types/database";

import {
  fetchContacts,
  formatDay,
  hasActiveFilters,
  isOverdue,
  parseContactFilters,
  primaryDeal,
  searchPattern,
} from "./contacts";

const ownerId = "00000000-0000-4000-8000-0000000000c1";

function deal(stage: DealSummary["stage"], updated: string): DealSummary {
  return {
    id: "30000000-0000-4000-8000-000000000001",
    stage,
    via: "project",
    amount: null,
    created_at: "2026-11-01T10:00:00+00:00",
    updated_at: updated,
  };
}

describe("parseContactFilters", () => {
  it("reads valid values and drops the rest", () => {
    expect(
      parseContactFilters({
        q: "  ada  ",
        kind: "client",
        stage: "proposal",
        due: "1",
        owner: ownerId,
      }),
    ).toEqual({ q: "ada", kind: "client", stage: "proposal", due: true, owner: ownerId });
    expect(
      parseContactFilters({ q: undefined, kind: "alien", stage: "x", due: "yes", owner: "nope" }),
    ).toEqual({ q: "", kind: null, stage: null, due: false, owner: null });
  });

  it("accepts the no owner marker and uses the first repeated value", () => {
    expect(parseContactFilters({ owner: "none", kind: ["partner", "client"] })).toMatchObject({
      owner: "none",
      kind: "partner",
    });
  });

  it("caps the search length", () => {
    expect(parseContactFilters({ q: "a".repeat(200) }).q).toHaveLength(80);
  });
});

describe("hasActiveFilters", () => {
  it("is false only for the empty filter set", () => {
    expect(hasActiveFilters(parseContactFilters({}))).toBe(false);
    expect(hasActiveFilters(parseContactFilters({ due: "1" }))).toBe(true);
    expect(hasActiveFilters(parseContactFilters({ q: "x" }))).toBe(true);
  });
});

describe("searchPattern", () => {
  it("removes characters that break the PostgREST or filter", () => {
    expect(searchPattern("a,b(c)*d%e\\f:\"g'")).toBe("a b c d e f g");
  });
});

describe("primaryDeal", () => {
  it("prefers the most recent open deal over a newer closed one", () => {
    const open = deal("meeting", "2026-11-02T10:00:00+00:00");
    const older = deal("new", "2026-10-01T10:00:00+00:00");
    const closed = deal("lost", "2026-11-04T10:00:00+00:00");
    expect(primaryDeal([older, closed, open])).toBe(open);
  });

  it("falls back to the latest closed deal and to null", () => {
    const won = deal("won", "2026-11-03T10:00:00+00:00");
    const lost = deal("lost", "2026-11-01T10:00:00+00:00");
    expect(primaryDeal([lost, won])).toBe(won);
    expect(primaryDeal([])).toBeNull();
  });
});

describe("isOverdue", () => {
  it("compares instants and ignores missing dates", () => {
    const now = "2026-11-05T10:00:00.000Z";
    expect(isOverdue("2026-11-05T09:59:00+00:00", now)).toBe(true);
    expect(isOverdue("2026-11-05T11:00:00+01:00", now)).toBe(false);
    expect(isOverdue(null, now)).toBe(false);
  });
});

describe("formatDay", () => {
  it("formats in Madrid time and passes unparseable values through", () => {
    expect(formatDay("2026-11-05T23:30:00+00:00", "es")).toContain("6");
    expect(formatDay("not a date", "es")).toBe("not a date");
  });
});

interface Result {
  data: unknown;
  error: unknown;
}

function builder(result: Result) {
  const calls: Record<string, unknown[][]> = {};
  const chain: Record<string, unknown> = {};
  for (const name of ["is", "eq", "not", "lte", "or", "order", "in"]) {
    chain[name] = vi.fn((...args: unknown[]) => {
      calls[name] = [...(calls[name] ?? []), args];
      return chain;
    });
  }
  chain.limit = vi.fn(() => Promise.resolve(result));
  chain.select = vi.fn((...args: unknown[]) => {
    calls.select = [...(calls.select ?? []), args];
    return chain;
  });
  return { chain, calls };
}

function clientWith(contacts: Result, people: Result) {
  const contactsBuilder = builder(contacts);
  const peopleChain = builder({ data: null, error: null });
  (peopleChain.chain.order as ReturnType<typeof vi.fn>).mockResolvedValue(people);
  const from = vi.fn((table: string) =>
    table === "contacts" ? contactsBuilder.chain : peopleChain.chain,
  );
  return {
    client: { from } as unknown as SupabaseClient<Database>,
    calls: contactsBuilder.calls,
  };
}

const rowFixture = {
  id: "20000000-0000-4000-8000-000000000001",
  full_name: "Ada",
  organization: null,
  email: null,
  phone: null,
  kind: "prospect",
  source: "manual",
  owner_id: ownerId,
  next_action: null,
  next_action_at: null,
  last_activity_at: null,
  created_at: "2026-11-01T10:00:00+00:00",
  deals: [],
};

const personFixture = { id: ownerId, full_name: "Cleo", role: "closer", is_active: true };

describe("fetchContacts", () => {
  const now = new Date("2026-11-05T10:00:00.000Z");

  it("returns parsed rows and owners", async () => {
    const { client } = clientWith(
      { data: [rowFixture], error: null },
      { data: [personFixture], error: null },
    );
    const result = await fetchContacts(client, parseContactFilters({}), now);
    expect(result).toMatchObject({ status: "ok", nowIso: now.toISOString() });
    if (result.status === "ok") {
      expect(result.rows).toHaveLength(1);
      expect(result.owners).toEqual([{ id: ownerId, name: "Cleo", assignable: true }]);
    }
  });

  it("applies each filter to the query", async () => {
    const { client, calls } = clientWith(
      { data: [], error: null },
      { data: [personFixture], error: null },
    );
    await fetchContacts(
      client,
      parseContactFilters({
        q: "ada",
        kind: "client",
        stage: "proposal",
        due: "1",
        owner: ownerId,
      }),
      now,
    );
    expect(calls.select?.[0]?.[0]).toContain("deals!inner");
    expect(calls.eq).toEqual(
      expect.arrayContaining([
        ["kind", "client"],
        ["deals.stage", "proposal"],
        ["owner_id", ownerId],
      ]),
    );
    expect(calls.lte).toEqual([["next_action_at", now.toISOString()]]);
    expect(calls.or?.[0]?.[0]).toContain("full_name.ilike.*ada*");
  });

  it("filters ownerless contacts and skips the inner join without a stage", async () => {
    const { client, calls } = clientWith({ data: [], error: null }, { data: [], error: null });
    await fetchContacts(client, parseContactFilters({ owner: "none" }), now);
    expect(calls.is).toEqual(expect.arrayContaining([["owner_id", null]]));
    expect(calls.select?.[0]?.[0]).not.toContain("inner");
  });

  it("reports an error for failed queries and malformed rows", async () => {
    const failed = clientWith(
      { data: null, error: { message: "boom" } },
      { data: [], error: null },
    );
    expect(await fetchContacts(failed.client, parseContactFilters({}), now)).toEqual({
      status: "error",
    });
    const malformed = clientWith({ data: [{ id: 1 }], error: null }, { data: [], error: null });
    expect(await fetchContacts(malformed.client, parseContactFilters({}), now)).toEqual({
      status: "error",
    });
  });
});
