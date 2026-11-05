import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { fetchMyRates, formatRate } from "./rates";

function clientWith(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { client: { from } as unknown as SupabaseClient<Database>, from, select, eq };
}

const userId = "00000000-0000-4000-8000-0000000000c1";

describe("fetchMyRates", () => {
  it("reads only the own rates", async () => {
    const { client, from, select, eq } = clientWith({
      data: { closer_rate: 10, closer_recurring_rate: 5.5 },
      error: null,
    });
    expect(await fetchMyRates(client, userId)).toEqual({
      status: "ok",
      data: { project: 10, recurring: 5.5 },
    });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("closer_rate, closer_recurring_rate");
    expect(eq).toHaveBeenCalledWith("id", userId);
  });

  it("keeps a missing rate as null", async () => {
    const { client } = clientWith({
      data: { closer_rate: null, closer_recurring_rate: null },
      error: null,
    });
    expect(await fetchMyRates(client, userId)).toEqual({
      status: "ok",
      data: { project: null, recurring: null },
    });
  });

  it("reports an error for a failed read, a missing row or an odd row", async () => {
    expect(
      await fetchMyRates(clientWith({ data: null, error: { code: "XX000" } }).client, userId),
    ).toEqual({
      status: "error",
    });
    expect(await fetchMyRates(clientWith({ data: null, error: null }).client, userId)).toEqual({
      status: "error",
    });
    expect(
      await fetchMyRates(
        clientWith({ data: { closer_rate: "x", closer_recurring_rate: null }, error: null }).client,
        userId,
      ),
    ).toEqual({ status: "error" });
  });
});

describe("formatRate", () => {
  it("drops useless decimals and uses the locale separator", () => {
    expect(formatRate(10, "es")).toBe("10");
    expect(formatRate(7.5, "es")).toBe("7,5");
    expect(formatRate(7.5, "en")).toBe("7.5");
    expect(formatRate(12.25, "es")).toBe("12,25");
  });
});
