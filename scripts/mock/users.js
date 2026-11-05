import { randomBytes, randomUUID } from "node:crypto";

import { bearer, extendAuthState, people, personById, stateFor } from "./auth.js";
import { readBody, route, send, sendEmpty } from "./registry.js";

const serviceKey = "test-service-role-key";
const day = 24 * 60 * 60 * 1000;

const adminId = people["enrolled@example.com"].id;
const closerId = people["closer@example.com"].id;
const subId = "00000000-0000-4000-8000-0000000000c3";

function userRow(overrides) {
  return {
    email: null,
    is_active: true,
    archived_at: null,
    parent_closer_id: null,
    closer_rate: null,
    parent_rate: null,
    closer_recurring_rate: null,
    parent_recurring_rate: null,
    payout_cadence: null,
    has_totp: false,
    contacts_count: 0,
    open_deals: 0,
    accrued_pending: 0,
    ...overrides,
  };
}

function seededUsers() {
  return [
    userRow({
      id: adminId,
      email: "enrolled@example.com",
      full_name: "Jose Enrolled",
      role: "admin",
      has_totp: true,
    }),
    userRow({
      id: closerId,
      email: "closer@example.com",
      full_name: "Cleo Closer",
      role: "closer",
      closer_rate: 10,
      closer_recurring_rate: 5,
      payout_cadence: "biweekly",
      has_totp: true,
      contacts_count: 3,
      open_deals: 2,
    }),
    userRow({
      id: subId,
      email: "sam@example.com",
      full_name: "Sam Subcloser",
      role: "closer",
      parent_closer_id: closerId,
      closer_rate: 8,
      parent_rate: 4,
      contacts_count: 1,
    }),
    userRow({
      id: people["client@example.com"].id,
      email: "client@example.com",
      full_name: "Carla Client",
      role: "client",
    }),
    userRow({
      id: people["inactive@example.com"].id,
      email: "inactive@example.com",
      full_name: "Ines Inactive",
      role: "admin",
      is_active: false,
      archived_at: "2026-10-01T09:00:00+00:00",
    }),
  ];
}

function invitationRow(overrides) {
  const now = Date.now();
  return {
    role: "closer",
    invited_by: adminId,
    parent_closer_id: null,
    accepted_at: null,
    revoked_at: null,
    created_at: new Date(now - 3 * day).toISOString(),
    expires_at: new Date(now + 5 * day).toISOString(),
    ...overrides,
  };
}

function seededInvitations() {
  const now = Date.now();
  return [
    invitationRow({
      id: "50000000-0000-4000-8000-000000000001",
      email: "pendiente@example.com",
      created_at: new Date(now - 2 * day).toISOString(),
    }),
    invitationRow({
      id: "50000000-0000-4000-8000-000000000002",
      email: "caducada@example.com",
      role: "freelance",
      expires_at: new Date(now - 2 * day).toISOString(),
      created_at: new Date(now - 9 * day).toISOString(),
    }),
    invitationRow({
      id: "50000000-0000-4000-8000-000000000003",
      email: "aceptada@example.com",
      role: "client",
      accepted_at: new Date(now - day).toISOString(),
      created_at: new Date(now - 4 * day).toISOString(),
    }),
    invitationRow({
      id: "50000000-0000-4000-8000-000000000004",
      email: "anulada@example.com",
      revoked_at: new Date(now - day).toISOString(),
      created_at: new Date(now - 5 * day).toISOString(),
    }),
  ];
}

extendAuthState((state) => {
  state.calls.invite = [];
  state.calls.renew = [];
  state.calls.revoke = [];
  state.calls.createUser = [];
  state.users = seededUsers();
  state.invitations = seededInvitations();
  state.usersMode = "data";
  state.usersRpcError = null;
});

route("POST", "/__auth/users-mode", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").usersMode = JSON.parse(await readBody(request)).mode;
  return send(response, 200, { ok: true });
});

route("POST", "/__auth/users-rpc-error", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").usersRpcError = JSON.parse(
    await readBody(request),
  ).error;
  return send(response, 200, { ok: true });
});

function adminSession(request, response) {
  const session = bearer(request);
  if (!session) {
    send(response, 401, { code: "PGRST301", message: "JWT invalid" });
    return null;
  }
  const allowed = personById(session.userId)?.[1].role === "admin" && session.level === "aal2";
  if (!allowed) {
    send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
    return null;
  }
  return session;
}

function rpcFailure(response, code, message) {
  return send(response, 400, { code, message, details: null, hint: null });
}

function issue(invitation) {
  return [{ invitation_id: invitation.id, token: randomBytes(32).toString("hex") }];
}

route("GET", "/rest/v1/invitations", ({ request, response }) => {
  const session = bearer(request);
  if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
  const auth = session.auth;
  const allowed = personById(session.userId)?.[1].role === "admin" && session.level === "aal2";
  if (auth.usersMode === "error") {
    return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
  }
  if (!allowed || auth.usersMode === "empty") return send(response, 200, []);
  return send(
    response,
    200,
    [...auth.invitations].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  );
});

route("POST", "/rest/v1/rpc/admin_users", ({ request, response }) => {
  const session = adminSession(request, response);
  if (!session) return;
  const auth = session.auth;
  if (auth.usersMode === "error") {
    return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
  }
  return send(response, 200, auth.usersMode === "empty" ? [] : auth.users);
});

route("POST", "/rest/v1/rpc/invite_user", async ({ request, response }) => {
  const session = adminSession(request, response);
  if (!session) return;
  const auth = session.auth;
  const args = JSON.parse(await readBody(request));
  auth.calls.invite.push(args);
  if (auth.usersRpcError)
    return send(response, 400, { details: null, hint: null, ...auth.usersRpcError });
  const email = String(args.p_email ?? "");
  if (email.startsWith("member")) return rpcFailure(response, "P0001", "email_already_member");
  const open = auth.invitations.find(
    (entry) =>
      entry.email === email &&
      entry.accepted_at === null &&
      entry.revoked_at === null &&
      new Date(entry.expires_at).getTime() > Date.now(),
  );
  if (email.startsWith("invited") || open) {
    return rpcFailure(response, "P0001", "email_already_invited");
  }
  const invitation = invitationRow({
    id: randomUUID(),
    email,
    role: args.p_role,
    parent_closer_id: args.p_parent_closer_id ?? null,
    created_at: new Date().toISOString(),
  });
  auth.invitations.push(invitation);
  return send(response, 200, issue(invitation));
});

route("POST", "/rest/v1/rpc/renew_invitation", async ({ request, response }) => {
  const session = adminSession(request, response);
  if (!session) return;
  const auth = session.auth;
  const args = JSON.parse(await readBody(request));
  auth.calls.renew.push(args);
  if (auth.usersRpcError)
    return send(response, 400, { details: null, hint: null, ...auth.usersRpcError });
  const invitation = auth.invitations.find((entry) => entry.id === args.p_id);
  if (!invitation) return rpcFailure(response, "P0001", "invitation_not_found");
  if (invitation.accepted_at) return rpcFailure(response, "P0001", "invitation_used");
  if (invitation.revoked_at) return rpcFailure(response, "P0001", "invitation_revoked");
  invitation.expires_at = new Date(Date.now() + 7 * day).toISOString();
  return send(response, 200, issue(invitation));
});

route("POST", "/rest/v1/rpc/revoke_invitation", async ({ request, response }) => {
  const session = adminSession(request, response);
  if (!session) return;
  const auth = session.auth;
  const args = JSON.parse(await readBody(request));
  auth.calls.revoke.push(args);
  if (auth.usersRpcError)
    return send(response, 400, { details: null, hint: null, ...auth.usersRpcError });
  const invitation = auth.invitations.find((entry) => entry.id === args.p_id);
  if (!invitation) return rpcFailure(response, "P0001", "invitation_not_found");
  if (invitation.accepted_at) return rpcFailure(response, "P0001", "invitation_used");
  invitation.revoked_at ??= new Date().toISOString();
  return sendEmpty(response);
});

function tagOf(email) {
  const match = /^[^+@]+\+([a-z0-9]+)@/.exec(String(email).toLowerCase());
  return match?.[1] ?? "";
}

route("POST", "/auth/v1/admin/users", async ({ request, response }) => {
  if (request.headers.authorization !== `Bearer ${serviceKey}`) {
    return send(response, 401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
  }
  const body = JSON.parse(await readBody(request));
  const email = String(body.email ?? "").toLowerCase();
  stateFor(tagOf(email)).calls.createUser.push({
    email,
    email_confirm: body.email_confirm === true,
  });
  if (email.startsWith("authdown")) {
    return send(response, 500, { code: 500, error_code: "unexpected_failure", msg: "internal" });
  }
  if (email.startsWith("exists")) {
    return send(response, 422, {
      code: 422,
      error_code: "email_exists",
      msg: "A user with this email address has already been registered",
    });
  }
  const now = new Date().toISOString();
  return send(response, 200, {
    id: randomUUID(),
    aud: "authenticated",
    role: "authenticated",
    email,
    email_confirmed_at: now,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    created_at: now,
    updated_at: now,
  });
});
