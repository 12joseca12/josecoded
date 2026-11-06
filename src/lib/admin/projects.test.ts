import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { fetchProjects, mapProjectError, runCreateProject, runUpdateProject } from "./projects";

const projectId = "60000000-0000-4000-8000-000000000001";
const dealId = "30000000-0000-4000-8000-0000000000a2";

const form = {
  name: "  Tienda  ",
  dealId,
  offerSlug: "web-negocio",
  freelanceId: "",
  startedAt: "2026-10-01",
  dueAt: "2026-12-01",
  brief: "  Resumen  ",
};

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

function updateClient(reply: Reply) {
  const select = vi.fn(() => Promise.resolve({ error: null, ...reply }));
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  return { client: { from } as unknown as SupabaseClient<Database>, update, eq };
}

describe("mapProjectError", () => {
  it("keeps typed errors, maps permissions and hides the rest", () => {
    expect(mapProjectError({ code: "P0001", message: "deal_not_won" })).toBe("deal_not_won");
    expect(mapProjectError({ code: "42501", message: "forbidden" })).toBe("forbidden");
    expect(mapProjectError({ code: "XX000", message: "boom" })).toBe("error");
    expect(mapProjectError({})).toBe("error");
  });
});

describe("runCreateProject", () => {
  it("normalizes the form and calls create_project", async () => {
    const { client, rpc } = rpcClient({ data: projectId });
    const result = await runCreateProject(client, form);
    expect(result).toEqual({ status: "done", id: projectId });
    expect(rpc).toHaveBeenCalledWith("create_project", {
      p_name: "Tienda",
      p_deal_id: dealId,
      p_offer_slug: "web-negocio",
      p_brief: "Resumen",
      p_freelance_id: undefined,
      p_started_at: "2026-10-01",
      p_due_at: "2026-12-01",
    });
  });

  it("rejects bad input without calling the database", async () => {
    const { client, rpc } = rpcClient({ data: projectId });
    expect(await runCreateProject(client, { ...form, name: "   " })).toEqual({
      status: "invalid",
      field: "name",
    });
    expect(await runCreateProject(client, { ...form, dueAt: "2026-09-01" })).toEqual({
      status: "invalid",
      field: "dueAt",
    });
    expect(await runCreateProject(client, { ...form, startedAt: "2026-13-45" })).toEqual({
      status: "invalid",
      field: "startedAt",
    });
    expect(await runCreateProject(client, { ...form, dealId: "nope" })).toEqual({
      status: "invalid",
      field: "dealId",
    });
    expect(await runCreateProject(client, { ...form, extra: 1 })).toMatchObject({
      status: "invalid",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns typed database errors and survives a thrown call", async () => {
    const typed = rpcClient({ error: { code: "P0001", message: "deal_not_won" } });
    expect(await runCreateProject(typed.client, form)).toEqual({
      status: "error",
      code: "deal_not_won",
    });
    const broken = rpcClient(new Error("network"));
    expect(await runCreateProject(broken.client, form)).toEqual({
      status: "error",
      code: "error",
    });
    const odd = rpcClient({ data: "not-a-uuid" });
    expect(await runCreateProject(odd.client, form)).toEqual({ status: "error", code: "error" });
  });
});

describe("runUpdateProject", () => {
  const edit = { id: projectId, name: "Nuevo", offerSlug: "", startedAt: "", dueAt: "" };

  it("updates only the editable columns", async () => {
    const { client, update, eq } = updateClient({ data: [{ id: projectId }] });
    expect(await runUpdateProject(client, edit)).toEqual({ status: "done", id: projectId });
    expect(update).toHaveBeenCalledWith({
      name: "Nuevo",
      offer_slug: null,
      started_at: null,
      due_at: null,
    });
    expect(eq).toHaveBeenCalledWith("id", projectId);
  });

  it("reports a missing project and a bad offer", async () => {
    expect(await runUpdateProject(updateClient({ data: [] }).client, edit)).toEqual({
      status: "error",
      code: "project_not_found",
    });
    expect(
      await runUpdateProject(
        updateClient({ error: { code: "23503", message: "fk" } }).client,
        edit,
      ),
    ).toEqual({ status: "error", code: "offer_not_found" });
    expect(await runUpdateProject(updateClient({ data: [] }).client, { ...edit, id: "x" })).toEqual(
      {
        status: "invalid",
        field: "name",
      },
    );
  });
});

describe("fetchProjects", () => {
  function reads(overrides: Partial<Record<string, Reply>> = {}) {
    const row = {
      id: projectId,
      name: "Tienda",
      client_id: null,
      client_name: null,
      contact_id: null,
      deal_id: null,
      offer_slug: "web-negocio",
      phase: "build",
      status: "active",
      freelance_id: null,
      freelance_name: null,
      started_at: null,
      due_at: null,
      archived_at: null,
      created_at: "2026-10-01T09:00:00+00:00",
      done: 2,
      total: 8,
      percent: 25,
      stories_to_decide: 1,
    };
    const replies: Record<string, Reply> = {
      project_overview: { data: [row] },
      deals: { data: [{ id: dealId, won_amount: 100, contacts: { full_name: "Bruno" } }] },
      offers: { data: [{ slug: "web-negocio", name_es: "Web de negocio" }] },
      team_profiles: { data: [{ id: projectId, full_name: "Fran" }] },
      ...overrides,
    };
    const chain = (table: string): unknown => {
      const reply = { error: null, ...replies[table] };
      const proxy: unknown = new Proxy(() => undefined, {
        get: (_, key) =>
          key === "then"
            ? (resolve: (v: Reply) => void) => {
                resolve(reply);
              }
            : proxy,
        apply: () => proxy,
      });
      return proxy;
    };
    return {
      client: { from: (table: string) => chain(table) } as unknown as SupabaseClient<Database>,
    };
  }

  it("reads the list and the form options", async () => {
    const result = await fetchProjects(reads().client);
    expect(result).toMatchObject({
      status: "ok",
      rows: [{ name: "Tienda", percent: 25 }],
      options: {
        deals: [{ id: dealId, label: "Bruno" }],
        offers: [{ slug: "web-negocio", name: "Web de negocio" }],
        freelances: [{ name: "Fran" }],
      },
    });
  });

  it("fails closed on read errors and malformed rows", async () => {
    expect(await fetchProjects(reads({ offers: { error: { message: "x" } } }).client)).toEqual({
      status: "error",
    });
    expect(
      await fetchProjects(reads({ project_overview: { data: [{ id: "x" }] } }).client),
    ).toEqual({ status: "error" });
  });
});
