import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  fetchProjectLinks,
  mapLinkError,
  runAddLink,
  runDeleteLink,
  runReorderLinks,
  runUpdateLink,
} from "./project-links";

const projectId = "60000000-0000-4000-8000-000000000001";
const linkId = "64000000-0000-4000-8000-000000000001";

interface Reply {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
}

function table(reply: Reply) {
  const select = vi.fn(() => Promise.resolve({ error: null, ...reply }));
  const chain = {
    eq: vi.fn(() => ({ select, order: select })),
    select,
  };
  const insert = vi.fn(() => Promise.resolve({ error: null, ...reply }));
  const update = vi.fn(() => chain);
  const del = vi.fn(() => chain);
  const read = vi.fn(() => ({ eq: () => ({ order: select }) }));
  const from = vi.fn(() => ({ insert, update, delete: del, select: read }));
  return { db: { from } as unknown as SupabaseClient<Database>, insert, update, del };
}

function rpcClient(reply: Reply) {
  const rpc = vi.fn(() => Promise.resolve({ error: null, ...reply }));
  return { db: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

const form = { name: "  Staging ", url: " https://staging.example.com/ ", usage: " Avance " };

describe("mapLinkError", () => {
  it("maps database codes to link errors", () => {
    expect(mapLinkError({ code: "23505" })).toBe("duplicate_url");
    expect(mapLinkError({ code: "23514" })).toBe("invalid_url");
    expect(mapLinkError({ code: "42501" })).toBe("forbidden");
    expect(mapLinkError({ code: "P0001", message: "ids_mismatch" })).toBe("ids_mismatch");
    expect(mapLinkError({ message: "boom" })).toBe("error");
  });
});

describe("runAddLink", () => {
  it("inserts trimmed values", async () => {
    const { db, insert } = table({});
    expect(await runAddLink(db, { projectId, ...form })).toEqual({ status: "done" });
    expect(insert).toHaveBeenCalledWith({
      project_id: projectId,
      name: "Staging",
      url: "https://staging.example.com/",
      usage: "Avance",
    });
  });

  it("only accepts https addresses", async () => {
    const { db, insert } = table({});
    for (const url of [
      "http://example.com",
      "javascript:alert(1)",
      "https://",
      "https:// space.com",
      "ftp://example.com",
      "example.com",
    ]) {
      expect(await runAddLink(db, { projectId, ...form, url })).toEqual({
        status: "invalid",
        field: "url",
      });
    }
    expect(insert).not.toHaveBeenCalled();
  });

  it("validates name and usage and maps duplicates", async () => {
    const { db } = table({});
    expect(await runAddLink(db, { projectId, ...form, name: " " })).toEqual({
      status: "invalid",
      field: "name",
    });
    expect(await runAddLink(db, { projectId, ...form, usage: "x".repeat(281) })).toEqual({
      status: "invalid",
      field: "usage",
    });
    const duplicate = table({ error: { code: "23505" } });
    expect(await runAddLink(duplicate.db, { projectId, ...form })).toEqual({
      status: "error",
      code: "duplicate_url",
    });
  });
});

describe("update, delete and reorder", () => {
  it("updates and reports a missing row", async () => {
    expect(
      await runUpdateLink(table({ data: [{ id: linkId }] }).db, { id: linkId, ...form }),
    ).toEqual({ status: "done" });
    expect(await runUpdateLink(table({ data: [] }).db, { id: linkId, ...form })).toEqual({
      status: "error",
      code: "link_not_found",
    });
  });

  it("deletes and reports a missing row", async () => {
    expect(await runDeleteLink(table({ data: [{ id: linkId }] }).db, { id: linkId })).toEqual({
      status: "done",
    });
    expect(await runDeleteLink(table({ data: [] }).db, { id: linkId })).toEqual({
      status: "error",
      code: "link_not_found",
    });
    expect(await runDeleteLink(table({}).db, { id: "x" })).toEqual({
      status: "error",
      code: "link_not_found",
    });
  });

  it("reorders through the rpc", async () => {
    const { db, rpc } = rpcClient({});
    expect(await runReorderLinks(db, { projectId, ids: [linkId] })).toEqual({ status: "done" });
    expect(rpc).toHaveBeenCalledWith("reorder_project_links", {
      p_project_id: projectId,
      p_ids: [linkId],
    });
    expect(await runReorderLinks(db, { projectId, ids: [] })).toEqual({
      status: "error",
      code: "ids_mismatch",
    });
    expect(
      await runReorderLinks(rpcClient({ error: { code: "P0001", message: "ids_mismatch" } }).db, {
        projectId,
        ids: [linkId],
      }),
    ).toEqual({ status: "error", code: "ids_mismatch" });
  });
});

describe("fetchProjectLinks", () => {
  it("reads and validates the rows", async () => {
    const row = {
      id: linkId,
      project_id: projectId,
      name: "A",
      url: "https://a.example",
      usage: null,
      sort: 0,
    };
    expect(await fetchProjectLinks(table({ data: [row] }).db, projectId)).toEqual({
      status: "ok",
      links: [row],
    });
    expect(await fetchProjectLinks(table({ data: [{ id: "x" }] }).db, projectId)).toEqual({
      status: "error",
    });
    expect(await fetchProjectLinks(table({ error: { message: "x" } }).db, projectId)).toEqual({
      status: "error",
    });
  });
});
