import { describe, expect, it, vi } from "vitest";

import { type OverdueRunner, runMoneyCron } from "./money";

function runner(result: { data: number | null; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { runner: { rpc } as unknown as OverdueRunner, rpc };
}

describe("runMoneyCron", () => {
  it("refuses a missing, empty or wrong secret before touching the database", async () => {
    const { runner: db, rpc } = runner({ data: 1, error: null });
    expect(await runMoneyCron(undefined, "x", db)).toEqual({
      status: 401,
      body: { error: "unauthorized" },
    });
    expect(await runMoneyCron("", "", db)).toMatchObject({ status: 401 });
    expect(await runMoneyCron("secret", null, db)).toMatchObject({ status: 401 });
    expect(await runMoneyCron("secret", "secreT", db)).toMatchObject({ status: 401 });
    expect(await runMoneyCron("secret", "secret-longer", db)).toMatchObject({ status: 401 });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("runs the overdue check with the right secret and reports how many were notified", async () => {
    const { runner: db, rpc } = runner({ data: 3, error: null });
    expect(await runMoneyCron("secret", "secret", db)).toEqual({
      status: 200,
      body: { notified: 3 },
    });
    expect(rpc).toHaveBeenCalledWith("payments_notify_overdue");
  });

  it("says so when the service client is not configured", async () => {
    expect(await runMoneyCron("secret", "secret", null)).toEqual({
      status: 503,
      body: { error: "unavailable" },
    });
  });

  it("reports database failures without leaking details", async () => {
    expect(
      await runMoneyCron(
        "secret",
        "secret",
        runner({ data: null, error: { code: "XX000" } }).runner,
      ),
    ).toEqual({ status: 500, body: { error: "failed" } });
    const throwing = {
      rpc: vi.fn().mockRejectedValue(new Error("boom")),
    } as unknown as OverdueRunner;
    expect(await runMoneyCron("secret", "secret", throwing)).toEqual({
      status: 500,
      body: { error: "failed" },
    });
  });
});
