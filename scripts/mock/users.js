import { randomBytes, randomUUID } from "node:crypto";

import { bearer, extendAuthState, people, personById, stateFor } from "./auth.js";
import { readBody, route, send, sendEmpty } from "./registry.js";

const serviceKey = "test-service-role-key";
const day = 24 * 60 * 60 * 1000;

const adminId = people["enrolled@example.com"].id;
const closerId = people["closer@example.com"].id;
const subId = "00000000-0000-4000-8000-0000000000c3";
const closerFactorId = "00000000-0000-4000-8000-0000000000e0";

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
  state.audit = [];
  state.calls.manage = [];
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

const factorDeletes = [];

route("POST", "/__auth/factors-reset", ({ response }) => {
  factorDeletes.length = 0;
  return send(response, 200, { ok: true });
});

route("GET", "/__auth/factor-deletes", ({ response }) => send(response, 200, factorDeletes));

function userById(auth, id) {
  return auth.users.find((entry) => entry.id === id);
}

function activeSubs(auth, id) {
  return auth.users.filter(
    (entry) => entry.parent_closer_id === id && entry.is_active && entry.archived_at === null,
  );
}

function record(auth, session, row, action, before, after) {
  auth.audit.push({
    id: auth.audit.length + 1,
    at: new Date().toISOString(),
    actor_id: session.userId,
    actor_name: "Jose Enrolled",
    table_name: "profiles",
    row_id: row.id,
    action,
    before,
    after,
  });
}

function manage(path, handler) {
  route("POST", path, async ({ request, response }) => {
    const session = adminSession(request, response);
    if (!session) return;
    const auth = session.auth;
    const args = JSON.parse(await readBody(request));
    auth.calls.manage.push({ name: path.split("/").pop(), args });
    if (auth.usersRpcError) {
      return send(response, 400, { details: null, hint: null, ...auth.usersRpcError });
    }
    return handler({ auth, session, args, response });
  });
}

manage("/rest/v1/rpc/set_user_rates", ({ auth, session, args, response }) => {
  const user = userById(auth, args.p_user_id);
  if (!user) return rpcFailure(response, "P0001", "user_not_found");
  if (user.role !== "closer") return rpcFailure(response, "P0001", "rates_only_for_closers");
  const closer = args.p_closer_rate ?? null;
  const recurring = args.p_closer_recurring_rate ?? null;
  if (recurring !== null && closer !== null && recurring >= closer) {
    return rpcFailure(response, "P0001", "rates_recurring_not_lower");
  }
  const before = { closer_rate: user.closer_rate, payout_cadence: user.payout_cadence };
  user.closer_rate = closer;
  user.parent_rate = args.p_parent_rate ?? null;
  user.closer_recurring_rate = recurring;
  user.parent_recurring_rate = args.p_parent_recurring_rate ?? null;
  user.payout_cadence = args.p_payout_cadence ?? null;
  record(auth, session, user, "update", before, {
    closer_rate: user.closer_rate,
    payout_cadence: user.payout_cadence,
  });
  return sendEmpty(response);
});

manage("/rest/v1/rpc/set_user_active", ({ auth, session, args, response }) => {
  const user = userById(auth, args.p_user_id);
  if (!user) return rpcFailure(response, "P0001", "user_not_found");
  if (!args.p_active && user.role === "closer" && activeSubs(auth, user.id).length > 0) {
    return rpcFailure(response, "23514", "closer_has_subclosers");
  }
  if (!args.p_active && user.role === "admin") {
    const others = auth.users.filter(
      (entry) => entry.role === "admin" && entry.id !== user.id && entry.is_active,
    );
    if (others.length === 0) return rpcFailure(response, "23514", "last_admin_required");
  }
  if (args.p_active && user.parent_closer_id) {
    const parent = userById(auth, user.parent_closer_id);
    if (!parent?.is_active) return rpcFailure(response, "P0001", "parent_closer_inactive");
  }
  const before = { is_active: user.is_active };
  user.is_active = args.p_active;
  user.archived_at = args.p_active ? null : new Date().toISOString();
  record(auth, session, user, "update", before, { is_active: user.is_active });
  return sendEmpty(response);
});

manage("/rest/v1/rpc/reassign_portfolio", ({ auth, args, response }) => {
  const from = userById(auth, args.p_from_user);
  const to = userById(auth, args.p_to_user);
  if (!from) return rpcFailure(response, "P0001", "user_not_found");
  if (!to || !to.is_active || !["closer", "admin"].includes(to.role) || to === from) {
    return rpcFailure(response, "P0001", "invalid_assignee");
  }
  if (to.id === subId) return rpcFailure(response, "P0001", "contact_email_conflict");
  const moved = { contacts: from.contacts_count, deals: from.open_deals, leads: 1 };
  to.contacts_count += from.contacts_count;
  to.open_deals += from.open_deals;
  from.contacts_count = 0;
  from.open_deals = 0;
  return send(response, 200, [moved]);
});

manage("/rest/v1/rpc/log_totp_reset", ({ auth, session, args, response }) => {
  const user = userById(auth, args.p_user_id);
  if (!user) return rpcFailure(response, "P0001", "user_not_found");
  user.has_totp = false;
  record(auth, session, user, "update", null, { totp_reset: true });
  return sendEmpty(response);
});

manage("/rest/v1/rpc/admin_audit_log", ({ auth, args, response }) => {
  const rows = auth.audit
    .filter((entry) => entry.row_id === args.p_row_id)
    .sort((a, b) => b.id - a.id);
  return send(response, 200, rows.slice(0, args.p_limit ?? 50));
});

const factorPath = /^\/auth\/v1\/admin\/users\/([0-9a-f-]{36})\/factors(?:\/([0-9a-f-]{36}))?$/;

function serviceOnly(request, response) {
  if (request.headers.authorization === `Bearer ${serviceKey}`) return true;
  send(response, 401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
  return false;
}

route("GET", factorPath, ({ request, response, match }) => {
  if (!serviceOnly(request, response)) return;
  const removed = factorDeletes.filter((entry) => entry.userId === match[1]).length;
  const factors = match[1] === closerId && removed === 0 ? [{ id: closerFactorId }] : [];
  return send(response, 200, factors);
});

route("DELETE", factorPath, ({ request, response, match }) => {
  if (!serviceOnly(request, response)) return;
  factorDeletes.push({ userId: match[1], factorId: match[2] });
  return send(response, 200, { id: match[2] });
});
