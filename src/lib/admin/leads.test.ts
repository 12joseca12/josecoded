import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { fetchLeads, formatLeadDate, leadsLimit } from "./leads";

function clientReturning(result: { data: unknown; error: unknown }) {
  const limit = vi.fn().mockResolvedValue(result);
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });
  const from = vi.fn().mockReturnValue({ select });
  return { client: { from } as unknown as SupabaseClient<Database>, from, select, order, limit };
}

const row = {
  id: "10000000-0000-4000-8000-000000000003",
  via: "pack",
  full_name: "Cara Pack",
  email: "cara@example.com",
  status: "new",
  created_at: "2026-11-03T09:30:00+00:00",
};

describe("fetchLeads", () => {
  it("reads the columns it shows, newest first, with a cap", async () => {
    const { client, from, select, order, limit } = clientReturning({ data: [row], error: null });
    expect(await fetchLeads(client)).toEqual({ status: "ok", rows: [row], limit: leadsLimit });
    expect(from).toHaveBeenCalledWith("leads");
    expect(select).toHaveBeenCalledWith("id, via, full_name, email, status, created_at");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(leadsLimit);
  });

  it("accepts rows without via or email", async () => {
    const { client } = clientReturning({ data: [{ ...row, via: null, email: null }], error: null });
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
    const broken = {
      from: () => ({
        select: () => ({ order: () => ({ limit: () => Promise.reject(new Error("x")) }) }),
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
