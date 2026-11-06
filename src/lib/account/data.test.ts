import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  fetchDeletion,
  fetchProfile,
  mapAccountError,
  runCancelDeletion,
  runRequestDeletion,
  runSaveProfile,
} from "./data";

interface Reply {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
}

function rpcClient(reply: Reply | Error) {
  const rpc = vi.fn(() =>
    reply instanceof Error ? Promise.reject(reply) : Promise.resolve({ error: null, ...reply }),
  );
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

function tableClient(reply: Reply | Error) {
  const maybeSingle = vi.fn(() =>
    reply instanceof Error ? Promise.reject(reply) : Promise.resolve({ error: null, ...reply }),
  );
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { client: { from } as unknown as SupabaseClient<Database>, select, eq };
}

describe("mapAccountError", () => {
  it("separates permission, missing objects and the rest", () => {
    expect(mapAccountError({ code: "42501" })).toBe("forbidden");
    expect(mapAccountError({ code: "PGRST202" })).toBe("unavailable");
    expect(mapAccountError({ code: "XX000" })).toBe("error");
  });
});

describe("fetchProfile", () => {
  const row = { full_name: "Ana", locale: "es", created_at: "2026-10-01T09:00:00+00:00" };

  it("reads only the own row and shapes it", async () => {
    const { client, select, eq } = tableClient({ data: row });
    expect(await fetchProfile(client, "u1")).toEqual({
      status: "ok",
      data: { fullName: "Ana", locale: "es", createdAt: row.created_at },
    });
    expect(select).toHaveBeenCalledWith("full_name, locale, created_at");
    expect(eq).toHaveBeenCalledWith("id", "u1");
  });

  it("fails closed on a missing row, a bad shape or a rejection", async () => {
    expect(await fetchProfile(tableClient({ data: null }).client, "u1")).toEqual({
      status: "error",
    });
    expect(
      await fetchProfile(tableClient({ data: { ...row, locale: "fr" } }).client, "u1"),
    ).toEqual({ status: "error" });
    expect(await fetchProfile(tableClient({ error: { code: "500" } }).client, "u1")).toEqual({
      status: "error",
    });
    expect(await fetchProfile(tableClient(new Error("down")).client, "u1")).toEqual({
      status: "error",
    });
  });
});

describe("runSaveProfile", () => {
  it("trims the name and calls the RPC with the typed arguments", async () => {
    const { client, rpc } = rpcClient({});
    expect(await runSaveProfile(client, { fullName: "  Ana Ruiz ", locale: "en" })).toEqual({
      status: "done",
      fullName: "Ana Ruiz",
      locale: "en",
    });
    expect(rpc).toHaveBeenCalledWith("update_my_profile", {
      p_full_name: "Ana Ruiz",
      p_locale: "en",
    });
  });

  it("rejects bad input before any call", async () => {
    const { client, rpc } = rpcClient({});
    expect(await runSaveProfile(client, { fullName: "   ", locale: "es" })).toEqual({
      status: "invalid",
      error: "name_required",
    });
    expect(await runSaveProfile(client, { fullName: "x".repeat(201), locale: "es" })).toEqual({
      status: "invalid",
      error: "name_too_long",
    });
    expect(await runSaveProfile(client, { fullName: "Ana", locale: "fr" })).toEqual({
      status: "invalid",
      error: "locale_invalid",
    });
    expect(await runSaveProfile(client, { fullName: "Ana", locale: "es", role: "admin" })).toEqual({
      status: "invalid",
      error: "name_required",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps database failures", async () => {
    const input = { fullName: "Ana", locale: "es" };
    expect(await runSaveProfile(rpcClient({ error: { code: "42501" } }).client, input)).toEqual({
      status: "error",
      code: "forbidden",
    });
    expect(await runSaveProfile(rpcClient(new Error("down")).client, input)).toEqual({
      status: "error",
      code: "error",
    });
  });
});

describe("deletion requests", () => {
  const stamp = "2026-11-06T10:00:00+00:00";

  it("reads the open request, if any", async () => {
    expect(await fetchDeletion(rpcClient({ data: stamp }).client)).toEqual({
      status: "ok",
      data: stamp,
    });
    expect(await fetchDeletion(rpcClient({ data: null }).client)).toEqual({
      status: "ok",
      data: null,
    });
    expect(await fetchDeletion(rpcClient({ error: { code: "PGRST202" } }).client)).toEqual({
      status: "unavailable",
    });
    expect(await fetchDeletion(rpcClient({ error: { code: "500" } }).client)).toEqual({
      status: "error",
    });
  });

  it("requests and withdraws through the RPCs", async () => {
    const asked = rpcClient({ data: stamp });
    expect(await runRequestDeletion(asked.client)).toEqual({ status: "done", requestedAt: stamp });
    expect(asked.rpc).toHaveBeenCalledWith("request_account_deletion");
    const withdrawn = rpcClient({});
    expect(await runCancelDeletion(withdrawn.client)).toEqual({
      status: "done",
      requestedAt: null,
    });
    expect(withdrawn.rpc).toHaveBeenCalledWith("cancel_account_deletion");
  });

  it("reports forbidden and unexpected failures", async () => {
    expect(await runRequestDeletion(rpcClient({ error: { code: "42501" } }).client)).toEqual({
      status: "error",
      code: "forbidden",
    });
    expect(await runCancelDeletion(rpcClient(new Error("down")).client)).toEqual({
      status: "error",
      code: "error",
    });
  });
});
