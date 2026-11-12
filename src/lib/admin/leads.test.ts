import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  fetchLeadDetail,
  fetchLeads,
  formatLeadDate,
  leadColumns,
  leadDetailColumns,
  leadsLimit,
} from "./leads";

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
  source: "form",
  full_name: "Cara Pack",
  email: "cara@example.com",
  organization: null,
  contact_id: null,
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
      rows: [{ ...row, submissionCount: 1 }],
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

const detailRow = {
  ...row,
  phone: null,
  message: "Hola",
  locale: "es",
  page_path: "/es/contacto",
  consent_at: "2026-11-03T09:30:00+00:00",
  assigned_at: null,
  assigned_by: null,
  deal_id: "20000000-0000-4000-8000-000000000001",
  company: null,
  offer_url: null,
  wanted_by: null,
  has_domain: null,
  has_store_accounts: null,
  extras: ["accounts"],
  offer_answers: { start: "idea", more: ["payments"] },
};

function detailClient(
  lead: Result,
  deal: Result = { data: { stage: "new" }, error: null },
  count: Result & { count?: number | null } = { data: null, error: null, count: 3 },
) {
  const countSource = vi.fn().mockResolvedValue(count);
  const countEmail = vi.fn().mockReturnValue({ eq: countSource });
  const countSelectFn = vi.fn().mockReturnValue({ eq: countEmail });
  const maybeSingle = vi.fn().mockResolvedValue(lead);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn((columns: string, options?: object) =>
    columns === leadDetailColumns ? { eq } : (countSelectFn(columns, options) as unknown),
  );
  const dealMaybe = vi.fn().mockResolvedValue(deal);
  const dealEq = vi.fn().mockReturnValue({ maybeSingle: dealMaybe });
  const dealSelect = vi.fn().mockReturnValue({ eq: dealEq });
  const peopleOrder = vi.fn().mockResolvedValue({ data: [person], error: null });
  const peopleSelect = vi
    .fn()
    .mockReturnValue({ in: vi.fn().mockReturnValue({ order: peopleOrder }) });
  const from = vi.fn((table: string) => {
    if (table === "profiles") return { select: peopleSelect };
    if (table === "deals") return { select: dealSelect };
    return { select };
  });
  return {
    client: { from } as unknown as SupabaseClient<Database>,
    select,
    eq,
    dealEq,
    countSelectFn,
    countEmail,
    countSource,
  };
}

describe("fetchLeadDetail", () => {
  it("reads one lead by id with its detail columns and the deal stage", async () => {
    const { client, select, eq, dealEq } = detailClient({ data: detailRow, error: null });
    const result = await fetchLeadDetail(client, row.id);
    expect(select).toHaveBeenCalledWith(leadDetailColumns);
    expect(eq).toHaveBeenCalledWith("id", row.id);
    expect(dealEq).toHaveBeenCalledWith("id", detailRow.deal_id);
    expect(result).toMatchObject({ status: "ok", dealStage: "new" });
  });

  it("counts the form submissions of the same email, case-insensitively", async () => {
    const { client, countSelectFn, countEmail, countSource } = detailClient({
      data: { ...detailRow, email: " Cara@Example.com " },
      error: null,
    });
    expect(await fetchLeadDetail(client, row.id)).toMatchObject({ submissionCount: 3 });
    expect(countSelectFn).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(countEmail).toHaveBeenCalledWith("email", "cara@example.com");
    expect(countSource).toHaveBeenCalledWith("source", "form");
  });

  it("falls back to the lead itself when the count fails or there is no email", async () => {
    const failed = detailClient({ data: detailRow, error: null }, undefined, {
      data: null,
      error: { code: "XX000" },
      count: null,
    });
    expect(await fetchLeadDetail(failed.client, row.id)).toMatchObject({ submissionCount: 1 });
    const noEmail = detailClient({ data: { ...detailRow, email: null }, error: null });
    expect(await fetchLeadDetail(noEmail.client, row.id)).toMatchObject({ submissionCount: 1 });
    expect(noEmail.countSelectFn).not.toHaveBeenCalled();
    const manual = detailClient({
      data: { ...detailRow, email: null, source: "manual" },
      error: null,
    });
    expect(await fetchLeadDetail(manual.client, row.id)).toMatchObject({ submissionCount: 0 });
  });

  it("skips the deal read when the lead has none and tolerates a failed deal read", async () => {
    const none = detailClient({ data: { ...detailRow, deal_id: null }, error: null });
    expect(await fetchLeadDetail(none.client, row.id)).toMatchObject({ dealStage: null });
    expect(none.dealEq).not.toHaveBeenCalled();
    const failed = detailClient(
      { data: detailRow, error: null },
      { data: null, error: { code: "XX000" } },
    );
    expect(await fetchLeadDetail(failed.client, row.id)).toMatchObject({ dealStage: null });
  });

  it("tells a missing lead from an error", async () => {
    expect(await fetchLeadDetail(detailClient({ data: null, error: null }).client, row.id)).toEqual(
      { status: "missing" },
    );
    expect(
      await fetchLeadDetail(detailClient({ data: null, error: { code: "XX000" } }).client, row.id),
    ).toEqual({ status: "error" });
    expect(
      await fetchLeadDetail(
        detailClient({ data: { ...detailRow, offer_answers: { start: 3 } }, error: null }).client,
        row.id,
      ),
    ).toEqual({ status: "error" });
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
