import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { changeDealStage, createContact, mapContactError, mapStageError } from "./contact-actions";

const owner = "00000000-0000-4000-8000-0000000000c1";
const dealId = "30000000-0000-4000-8000-000000000001";

function insertClient(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });
  return { client: { from } as unknown as SupabaseClient<Database>, insert };
}

function updateClient(result: { data: unknown; error: unknown }) {
  const select = vi.fn().mockResolvedValue(result);
  const second = vi.fn().mockReturnValue({ select });
  const first = vi.fn().mockReturnValue({ eq: second });
  const update = vi.fn().mockReturnValue({ eq: first });
  const from = vi.fn().mockReturnValue({ update });
  return { client: { from } as unknown as SupabaseClient<Database>, update, first, second };
}

const validContact = {
  fullName: "  Ada Lovelace ",
  email: "",
  phone: "600 111 222",
  organization: "",
  kind: "prospect",
};

describe("createContact", () => {
  it("inserts for the caller and turns blanks into nulls", async () => {
    const { client, insert } = insertClient({ data: { id: "x" }, error: null });
    const result = await createContact(client, owner, validContact);
    expect(result).toEqual({ status: "done", id: "x" });
    expect(insert).toHaveBeenCalledWith({
      owner_id: owner,
      full_name: "Ada Lovelace",
      email: null,
      phone: "600 111 222",
      organization: null,
      kind: "prospect",
    });
  });

  it("names the first invalid field without touching the database", async () => {
    const { client, insert } = insertClient({ data: null, error: null });
    expect(await createContact(client, owner, { ...validContact, fullName: "  " })).toEqual({
      status: "invalid",
      field: "fullName",
    });
    expect(await createContact(client, owner, { ...validContact, email: "nope" })).toEqual({
      status: "invalid",
      field: "email",
    });
    expect(await createContact(client, owner, { ...validContact, extra: 1 })).toMatchObject({
      status: "invalid",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("maps database errors", async () => {
    const duplicate = insertClient({ data: null, error: { code: "23505" } });
    expect(await createContact(duplicate.client, owner, validContact)).toEqual({
      status: "duplicate",
    });
    const denied = insertClient({ data: null, error: { code: "42501" } });
    expect(await createContact(denied.client, owner, validContact)).toEqual({
      status: "forbidden",
    });
    const broken = insertClient({ data: null, error: { code: "XX000" } });
    expect(await createContact(broken.client, owner, validContact)).toEqual({ status: "error" });
  });
});

describe("changeDealStage", () => {
  const base = {
    dealId,
    stage: "meeting",
    reason: "",
    expectedUpdatedAt: "2026-11-05T10:00:00+00:00",
  };

  it("updates guarded by the version the user saw", async () => {
    const { client, update, first, second } = updateClient({ data: [{ id: dealId }], error: null });
    expect(await changeDealStage(client, base)).toEqual({ status: "done" });
    expect(update).toHaveBeenCalledWith({ stage: "meeting", lost_reason: null });
    expect(first).toHaveBeenCalledWith("id", dealId);
    expect(second).toHaveBeenCalledWith("updated_at", base.expectedUpdatedAt);
  });

  it("stores the reason only when the deal is lost", async () => {
    const { client, update } = updateClient({ data: [{ id: dealId }], error: null });
    await changeDealStage(client, { ...base, stage: "lost", reason: " precio " });
    expect(update).toHaveBeenCalledWith({ stage: "lost", lost_reason: "precio" });
  });

  it("requires a reason to lose and refuses won", async () => {
    const { client, update } = updateClient({ data: [], error: null });
    expect(await changeDealStage(client, { ...base, stage: "lost" })).toEqual({
      status: "invalid",
      field: "reason",
    });
    expect(await changeDealStage(client, { ...base, stage: "won" })).toEqual({
      status: "invalid",
      field: "stage",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("reports stale when no row matches the version", async () => {
    const { client } = updateClient({ data: [], error: null });
    expect(await changeDealStage(client, base)).toEqual({ status: "stale" });
  });

  it("maps database errors", () => {
    expect(mapStageError({ code: "42501" })).toEqual({ status: "forbidden" });
    expect(mapStageError({ code: "XX000" })).toEqual({ status: "error" });
    expect(mapContactError({ code: "23505" })).toEqual({ status: "duplicate" });
  });
});
