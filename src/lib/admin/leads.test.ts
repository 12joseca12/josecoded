import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { fetchLeads, formatLeadDate, leadColumns, leadsLimit } from "./leads";

interface Result {
  data: unknown;
  error: unknown;
}

const person = {
  id: "00000000-0000-4000-8000-0000000000c1",
  full_name: "Cleo Closer",
  role: "closer",
  is_active: true,
};

function clientReturning(leads: Result, people: Result = { data: [person], error: null }) {
  const limit = vi.fn().mockResolvedValue(leads);
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });
  const peopleOrder = vi.fn().mockResolvedValue(people);
  const peopleIn = vi.fn().mockReturnValue({ order: peopleOrder });
  const peopleSelect = vi.fn().mockReturnValue({ in: peopleIn });
  const from = vi.fn((table: string) =>
    table === "profiles" ? { select: peopleSelect } : { select },
  );
  return {
    client: { from } as unknown as SupabaseClient<Database>,
    from,
    select,
    order,
    limit,
    peopleSelect,
    peopleIn,
    peopleOrder,
  };
}

const row = {
  id: "10000000-0000-4000-8000-000000000003",
  via: "project",
  full_name: "Cara Pack",
  email: "cara@example.com",
  status: "new",
  created_at: "2026-11-03T09:30:00+00:00",
  assigned_to: null,
  discard_reason: null,
  offer: "web-negocio",
};

describe("fetchLeads", () => {
  it("reads the columns it shows, newest first, with a cap", async () => {
    const { client, from, select, order, limit } = clientReturning({ data: [row], error: null });
    expect(await fetchLeads(client)).toEqual({
      status: "ok",
      rows: [row],
      assignees: [{ id: person.id, name: "Cleo Closer", assignable: true }],
      limit: leadsLimit,
    });
    expect(from).toHaveBeenCalledWith("leads");
    expect(select).toHaveBeenCalledWith(leadColumns);
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(leadsLimit);
  });

  it("reads the closers and admins that can hold a lead", async () => {
    const { client, peopleSelect, peopleIn, peopleOrder } = clientReturning({
      data: [row],
      error: null,
    });
    await fetchLeads(client);
    expect(peopleSelect).toHaveBeenCalledWith("id, full_name, role, is_active");
    expect(peopleIn).toHaveBeenCalledWith("role", ["admin", "closer"]);
    expect(peopleOrder).toHaveBeenCalledWith("full_name");
  });

  it("only offers active closers as assignees", async () => {
    const people = [
      person,
      { ...person, id: "00000000-0000-4000-8000-0000000000c2", is_active: false },
      { ...person, id: "00000000-0000-4000-8000-0000000000a1", role: "admin" },
    ];
    const { client } = clientReturning({ data: [], error: null }, { data: people, error: null });
    const result = await fetchLeads(client);
    expect(result.status === "ok" && result.assignees.map((entry) => entry.assignable)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it("accepts rows without via or email", async () => {
    const { client } = clientReturning({
      data: [{ ...row, via: null, email: null }],
      error: null,
    });
    const result = await fetchLeads(client);
    expect(result.status).toBe("ok");
  });

  it("reports an error for API errors, bad shapes and thrown fetches", async () => {
    expect(
      await fetchLeads(clientReturning({ data: null, error: { code: "XX000" } }).client),
    ).toEqual({ status: "error" });
    expect(
      await fetchLeads(
        clientReturning({ data: [{ ...row, status: "weird" }], error: null }).client,
      ),
    ).toEqual({ status: "error" });
    expect(
      await fetchLeads(
        clientReturning({ data: [row], error: null }, { data: null, error: { code: "XX000" } })
          .client,
      ),
    ).toEqual({ status: "error" });
    expect(
      await fetchLeads(
        clientReturning({ data: [row], error: null }, { data: [{ id: "x" }], error: null }).client,
      ),
    ).toEqual({ status: "error" });
    const broken = {
      from: () => ({
        select: () => ({
          order: () => ({ limit: () => Promise.reject(new Error("x")) }),
          in: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        }),
      }),
    };
    expect(await fetchLeads(broken as unknown as SupabaseClient<Database>)).toEqual({
      status: "error",
    });
  });
});

describe("formatLeadDate", () => {
  it("formats in Madrid time", () => {
    expect(formatLeadDate("2026-11-03T09:30:00+00:00", "es")).toContain("10:30");
  });

  it("falls back to the raw value", () => {
    expect(formatLeadDate("not a date", "es")).toBe("not a date");
  });
});
