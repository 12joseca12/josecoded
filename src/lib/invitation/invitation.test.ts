import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";
import type { InvitationSummary } from "@/types/invitation";

import {
  decideInvitationView,
  formatInvitationDate,
  isInvitationToken,
  readInvitation,
  runAccept,
} from "./invitation";

const token = "a".repeat(64);

function summary(overrides: Partial<Extract<InvitationSummary, { role: string }>> = {}) {
  return {
    status: "pending",
    role: "closer",
    inviterName: "Jose",
    email: "Nueva@Example.com",
    expiresAt: "2026-11-12T10:00:00Z",
    ...overrides,
  } as InvitationSummary;
}

function clientWith(reply: { data?: unknown; error?: { message: string } | null } | Error) {
  const rpc = vi.fn(() =>
    reply instanceof Error ? Promise.reject(reply) : Promise.resolve({ error: null, ...reply }),
  );
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

describe("isInvitationToken", () => {
  it("accepts url safe tokens and rejects the rest", () => {
    expect(isInvitationToken(token)).toBe(true);
    for (const value of ["", "a b", "a/b", "../x", "x".repeat(129)]) {
      expect(isInvitationToken(value)).toBe(false);
    }
  });
});

describe("readInvitation", () => {
  it("maps the row without asking for malformed tokens", async () => {
    const { client, rpc } = clientWith({
      data: [
        {
          role: "closer",
          invited_by_name: "Jose",
          email: "nueva@example.com",
          expires_at: "2026-11-12T10:00:00Z",
          status: "pending",
        },
      ],
    });
    expect(await readInvitation(client, token)).toEqual({
      status: "pending",
      role: "closer",
      inviterName: "Jose",
      email: "nueva@example.com",
      expiresAt: "2026-11-12T10:00:00Z",
    });
    expect(rpc).toHaveBeenCalledWith("read_invitation", { p_token: token });
    expect(await readInvitation(client, "../x")).toEqual({ status: "unknown" });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("treats an empty answer as unknown and failures as unreadable", async () => {
    expect(await readInvitation(clientWith({ data: [] }).client, token)).toEqual({
      status: "unknown",
    });
    expect(await readInvitation(clientWith({ error: { message: "x" } }).client, token)).toBeNull();
    expect(await readInvitation(clientWith({ data: [{ role: "root" }] }).client, token)).toBeNull();
    expect(await readInvitation(clientWith(new Error("down")).client, token)).toBeNull();
  });
});

describe("decideInvitationView", () => {
  const anonymous = { kind: "anonymous" } as const;
  const member = { kind: "member", destination: "/es/crm" } as const;

  it("shows a gone screen for unknown, revoked, expired and used invitations", () => {
    expect(decideInvitationView({ status: "unknown" }, anonymous)).toEqual({
      kind: "gone",
      reason: "unknown",
    });
    expect(decideInvitationView(summary({ status: "revoked" }), anonymous)).toEqual({
      kind: "gone",
      reason: "revoked",
    });
    expect(decideInvitationView(summary({ status: "expired" }), member)).toEqual({
      kind: "gone",
      reason: "expired",
    });
    expect(decideInvitationView(summary({ status: "accepted" }), anonymous)).toEqual({
      kind: "gone",
      reason: "used",
    });
    expect(
      decideInvitationView(summary({ status: "accepted" }), { kind: "profileless", email: null }),
    ).toEqual({ kind: "gone", reason: "used" });
  });

  it("sends people with a profile to their zone", () => {
    expect(decideInvitationView(summary(), member)).toEqual({
      kind: "enter",
      destination: "/es/crm",
    });
    expect(decideInvitationView(summary({ status: "accepted" }), member)).toEqual({
      kind: "enter",
      destination: "/es/crm",
    });
  });

  it("asks anonymous visitors to sign in", () => {
    expect(decideInvitationView(summary(), anonymous)).toEqual({ kind: "login" });
  });

  it("accepts only when the session email matches, ignoring case", () => {
    expect(
      decideInvitationView(summary(), { kind: "profileless", email: "nueva@example.COM" }),
    ).toEqual({ kind: "accept" });
    expect(
      decideInvitationView(summary(), { kind: "profileless", email: "otra@example.com" }),
    ).toEqual({ kind: "mismatch" });
    expect(decideInvitationView(summary(), { kind: "profileless", email: null })).toEqual({
      kind: "mismatch",
    });
  });
});

describe("runAccept", () => {
  const input = { token, fullName: " Nueva Persona ", locale: "es" };

  it("accepts and sends each role to its zone", async () => {
    for (const [role, destination] of [
      ["closer", "/es/crm"],
      ["freelance", "/es/freelance"],
      ["client", "/es/area"],
    ] as const) {
      const { client, rpc } = clientWith({ data: role });
      expect(await runAccept(client, "es", input)).toEqual({ status: "done", destination });
      expect(rpc).toHaveBeenCalledWith("accept_invitation", {
        p_token: token,
        p_full_name: "Nueva Persona",
        p_locale: "es",
      });
    }
  });

  it("rejects bad input before calling Supabase", async () => {
    const { client, rpc } = clientWith({ data: "closer" });
    for (const bad of [
      { ...input, fullName: "  " },
      { ...input, fullName: "x".repeat(201) },
      { ...input, token: "../x" },
      { ...input, locale: "fr" },
      { ...input, extra: true },
    ]) {
      expect(await runAccept(client, "es", bad)).toEqual({ status: "invalid" });
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps database errors to failures", async () => {
    for (const [message, failure] of [
      ["invitation_not_found", "gone"],
      ["invitation_revoked", "gone"],
      ["invitation_expired", "expired"],
      ["invitation_used", "used"],
      ["invitation_email_mismatch", "mismatch"],
      ["profile_exists", "exists"],
      ["boom", "error"],
    ] as const) {
      expect(await runAccept(clientWith({ error: { message } }).client, "es", input)).toEqual({
        status: "failed",
        failure,
      });
    }
    expect(
      await runAccept(clientWith({ error: { message: "invalid_full_name" } }).client, "es", input),
    ).toEqual({ status: "invalid" });
  });

  it("fails on an unexpected role or a thrown error", async () => {
    expect(await runAccept(clientWith({ data: "root" }).client, "es", input)).toEqual({
      status: "failed",
      failure: "error",
    });
    expect(await runAccept(clientWith(new Error("down")).client, "es", input)).toEqual({
      status: "failed",
      failure: "error",
    });
  });
});

describe("formatInvitationDate", () => {
  it("formats in the site time zone", () => {
    expect(formatInvitationDate("2026-11-12T10:00:00Z", "es")).toBe("12 de noviembre de 2026");
    expect(formatInvitationDate("nope", "es")).toBe("nope");
  });
});
