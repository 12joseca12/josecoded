import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { addActivity, reassignContact } from "./detail-actions";

const author = "00000000-0000-4000-8000-0000000000c1";
const contactId = "20000000-0000-4000-8000-0000000000a1";
const dealId = "30000000-0000-4000-8000-0000000000a1";
const ownerId = "00000000-0000-4000-8000-0000000000c2";

const valid = { contactId, dealId: "", kind: "call", body: "  Hablamos  " };

function insertClient(error: unknown) {
  const insert = vi.fn().mockResolvedValue({ error });
  const from = vi.fn().mockReturnValue({ insert });
  return { client: { from } as unknown as SupabaseClient<Database>, insert };
}

describe("addActivity", () => {
  it("inserts as the caller with a trimmed body and no deal", async () => {
    const { client, insert } = insertClient(null);
    expect(await addActivity(client, author, valid)).toEqual({ status: "done" });
    expect(insert).toHaveBeenCalledWith({
      contact_id: contactId,
      deal_id: null,
      author_id: author,
      kind: "call",
      body: "Hablamos",
    });
  });

  it("links the deal when given", async () => {
    const { client, insert } = insertClient(null);
    await addActivity(client, author, { ...valid, dealId });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ deal_id: dealId }));
  });

  it("rejects empty bodies and system kinds without touching the database", async () => {
    const { client, insert } = insertClient(null);
    expect(await addActivity(client, author, { ...valid, body: "   " })).toEqual({
      status: "invalid",
      field: "body",
    });
    expect(await addActivity(client, author, { ...valid, kind: "system" })).toEqual({
      status: "invalid",
      field: "kind",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("maps database errors", async () => {
    expect(await addActivity(insertClient({ code: "23503" }).client, author, valid)).toEqual({
      status: "invalid",
      field: "dealId",
    });
    expect(await addActivity(insertClient({ code: "42501" }).client, author, valid)).toEqual({
      status: "forbidden",
    });
    expect(await addActivity(insertClient({ code: "XX000" }).client, author, valid)).toEqual({
      status: "error",
    });
  });
});

interface Step {
  data: unknown;
  error: unknown;
}

function reassignClient(people: Step, moved: Step, deals: Step) {
  const dealsIn = vi.fn().mockResolvedValue(deals);
  const dealsEq = vi.fn().mockReturnValue({ in: dealsIn });
  const dealsUpdate = vi.fn().mockReturnValue({ eq: dealsEq });
  const select = vi.fn().mockResolvedValue(moved);
  const contactsEq = vi.fn().mockReturnValue({ select });
  const contactsUpdate = vi.fn().mockReturnValue({ eq: contactsEq });
  const peopleIn = vi.fn().mockResolvedValue(people);
  const peopleSelect = vi.fn().mockReturnValue({ in: peopleIn });
  const from = vi.fn((table: string) => {
    if (table === "profiles") return { select: peopleSelect };
    if (table === "contacts") return { update: contactsUpdate };
    return { update: dealsUpdate };
  });
  return {
    client: { from } as unknown as SupabaseClient<Database>,
    contactsUpdate,
    dealsUpdate,
    dealsIn,
  };
}

const ok: Step = { data: [{ id: ownerId, is_active: true }], error: null };
const moved: Step = { data: [{ id: contactId }], error: null };
const done: Step = { data: null, error: null };

describe("reassignContact", () => {
  it("moves the contact and its open deals to an active owner", async () => {
    const { client, contactsUpdate, dealsUpdate, dealsIn } = reassignClient(ok, moved, done);
    expect(await reassignContact(client, { contactId, ownerId })).toEqual({ status: "done" });
    expect(contactsUpdate).toHaveBeenCalledWith({ owner_id: ownerId });
    expect(dealsUpdate).toHaveBeenCalledWith({ owner_id: ownerId });
    expect(dealsIn).toHaveBeenCalledWith("stage", ["new", "contacted", "meeting", "proposal"]);
  });

  it("refuses inactive or unknown owners", async () => {
    const inactive: Step = { data: [{ id: ownerId, is_active: false }], error: null };
    const { client, contactsUpdate } = reassignClient(inactive, moved, done);
    expect(await reassignContact(client, { contactId, ownerId })).toEqual({ status: "invalid" });
    expect(contactsUpdate).not.toHaveBeenCalled();
    expect(await reassignContact(client, { contactId, ownerId: "x" })).toEqual({
      status: "invalid",
    });
  });

  it("reports forbidden when the contact update is denied or matches nothing", async () => {
    const denied = reassignClient(ok, { data: null, error: { code: "42501" } }, done);
    expect(await reassignContact(denied.client, { contactId, ownerId })).toEqual({
      status: "forbidden",
    });
    const hidden = reassignClient(ok, { data: [], error: null }, done);
    expect(await reassignContact(hidden.client, { contactId, ownerId })).toEqual({
      status: "forbidden",
    });
  });

  it("reports an error when the deals update fails", async () => {
    const failed = reassignClient(ok, moved, { data: null, error: { code: "XX000" } });
    expect(await reassignContact(failed.client, { contactId, ownerId })).toEqual({
      status: "error",
    });
  });
});
