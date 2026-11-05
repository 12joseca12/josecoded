import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { invitationPath, mapInviteError, runInvite, runRenew, runRevoke } from "./invite";

const invitationId = "50000000-0000-4000-8000-000000000001";
const parentId = "00000000-0000-4000-8000-0000000000c1";
const token = "a".repeat(64);

const form = {
  email: " Nueva@Example.com ",
  role: "closer",
  parentCloserId: "",
  closerRate: "10",
  parentRate: "",
  closerRecurringRate: "5,5",
  parentRecurringRate: "",
  payoutCadence: "biweekly",
  note: " primera ",
};

interface Reply {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
}

function clientWith(replies: Record<string, Reply | Error>) {
  const rpc = vi.fn((name: string) => {
    const reply = replies[name] ?? { data: null, error: null };
    return reply instanceof Error
      ? Promise.reject(reply)
      : Promise.resolve({ error: null, ...reply });
  });
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

const issuedReply = { data: [{ invitation_id: invitationId, token }] };

describe("mapInviteError", () => {
  it("keeps typed errors, maps permissions and hides the rest", () => {
    expect(mapInviteError({ code: "P0001", message: "email_already_invited" })).toBe(
      "email_already_invited",
    );
    expect(mapInviteError({ code: "P0001", message: "invalid_parent_closer" })).toBe(
      "invalid_parent_closer",
    );
    expect(mapInviteError({ code: "42501", message: "forbidden" })).toBe("forbidden");
    expect(mapInviteError({ code: "XX000", message: "boom" })).toBe("error");
    expect(mapInviteError({})).toBe("error");
  });
});

describe("invitationPath", () => {
  it("builds the localized path", () => {
    expect(invitationPath("es", token)).toBe(`/es/invitacion/${token}`);
  });
});

describe("runInvite", () => {
  it("invites with the normalized input and then creates the account", async () => {
    const { client, rpc } = clientWith({ invite_user: issuedReply });
    const createAuthUser = vi.fn(() => Promise.resolve("created" as const));
    const result = await runInvite({ client, createAuthUser }, "es", form);
    expect(result).toEqual({
      status: "done",
      invitationId,
      path: `/es/invitacion/${token}`,
    });
    expect(rpc).toHaveBeenCalledWith("invite_user", {
      p_email: "nueva@example.com",
      p_role: "closer",
      p_parent_closer_id: undefined,
      p_closer_rate: 10,
      p_parent_rate: undefined,
      p_closer_recurring_rate: 5.5,
      p_parent_recurring_rate: undefined,
      p_payout_cadence: "biweekly",
      p_note: "primera",
    });
    expect(createAuthUser).toHaveBeenCalledWith("nueva@example.com");
  });

  it("sends a subcloser as a closer with its parent", async () => {
    const { client, rpc } = clientWith({ invite_user: issuedReply });
    const createAuthUser = vi.fn(() => Promise.resolve("exists" as const));
    const result = await runInvite({ client, createAuthUser }, "en", {
      ...form,
      role: "subcloser",
      parentCloserId: parentId,
      parentRate: "5",
    });
    expect(result.status).toBe("done");
    expect(rpc).toHaveBeenCalledWith(
      "invite_user",
      expect.objectContaining({ p_role: "closer", p_parent_closer_id: parentId, p_parent_rate: 5 }),
    );
  });

  it.each([
    [{ email: "no-email" }, "email"],
    [{ role: "admin" }, "role"],
    [{ role: "subcloser" }, "parentCloserId"],
    [{ parentCloserId: parentId }, "parentCloserId"],
    [{ closerRate: "101" }, "closerRate"],
    [{ closerRate: "abc" }, "closerRate"],
    [{ closerRate: "10.123" }, "closerRate"],
    [{ closerRecurringRate: "10" }, "closerRecurringRate"],
    [{ role: "freelance" }, "closerRate"],
    [{ payoutCadence: "daily" }, "payoutCadence"],
    [{ note: "x".repeat(501) }, "note"],
  ])("rejects %j before touching Supabase", async (patch, field) => {
    const { client, rpc } = clientWith({});
    const createAuthUser = vi.fn(() => Promise.resolve("created" as const));
    const result = await runInvite({ client, createAuthUser }, "es", { ...form, ...patch });
    expect(result).toEqual({ status: "invalid", field });
    expect(rpc).not.toHaveBeenCalled();
    expect(createAuthUser).not.toHaveBeenCalled();
  });

  it("rejects unknown keys", async () => {
    const { client } = clientWith({});
    const result = await runInvite(
      { client, createAuthUser: () => Promise.resolve("created") },
      "es",
      { ...form, admin: true },
    );
    expect(result.status).toBe("invalid");
  });

  it("returns the typed error and creates no account when the invitation fails", async () => {
    const { client } = clientWith({
      invite_user: { error: { code: "P0001", message: "email_already_member" } },
    });
    const createAuthUser = vi.fn(() => Promise.resolve("created" as const));
    expect(await runInvite({ client, createAuthUser }, "es", form)).toEqual({
      status: "error",
      code: "email_already_member",
    });
    expect(createAuthUser).not.toHaveBeenCalled();
  });

  it("revokes the invitation when the account cannot be created", async () => {
    const { client, rpc } = clientWith({ invite_user: issuedReply });
    const result = await runInvite(
      { client, createAuthUser: () => Promise.resolve("failed") },
      "es",
      form,
    );
    expect(result).toEqual({ status: "error", code: "unavailable" });
    expect(rpc).toHaveBeenCalledWith("revoke_invitation", { p_id: invitationId });
  });

  it("treats a malformed reply and thrown errors as generic failures", async () => {
    const deps = { createAuthUser: () => Promise.resolve("created" as const) };
    expect(
      await runInvite(
        { ...deps, client: clientWith({ invite_user: { data: [] } }).client },
        "es",
        form,
      ),
    ).toEqual({ status: "error", code: "error" });
    expect(
      await runInvite(
        { ...deps, client: clientWith({ invite_user: new Error("down") }).client },
        "es",
        form,
      ),
    ).toEqual({ status: "error", code: "error" });
  });
});

describe("runRenew and runRevoke", () => {
  it("renews and returns the new path", async () => {
    const { client, rpc } = clientWith({ renew_invitation: issuedReply });
    expect(await runRenew(client, "es", { invitationId })).toEqual({
      status: "done",
      path: `/es/invitacion/${token}`,
    });
    expect(rpc).toHaveBeenCalledWith("renew_invitation", { p_id: invitationId });
  });

  it("maps invitation states on renew and revoke", async () => {
    const used = clientWith({
      renew_invitation: { error: { code: "P0001", message: "invitation_used" } },
      revoke_invitation: { error: { code: "P0001", message: "invitation_revoked" } },
    }).client;
    expect(await runRenew(used, "es", { invitationId })).toEqual({
      status: "error",
      code: "invitation_used",
    });
    expect(await runRevoke(used, { invitationId })).toEqual({
      status: "error",
      code: "invitation_revoked",
    });
  });

  it("revokes without a path and rejects bad ids", async () => {
    const { client, rpc } = clientWith({});
    expect(await runRevoke(client, { invitationId })).toEqual({ status: "done", path: null });
    expect(await runRevoke(client, { invitationId: "nope" })).toEqual({
      status: "error",
      code: "error",
    });
    expect(await runRenew(client, "es", { invitationId, extra: 1 })).toEqual({
      status: "error",
      code: "error",
    });
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
