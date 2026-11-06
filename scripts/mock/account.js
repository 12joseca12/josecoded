import { bearer, extendAuthState, personById, stateFor } from "./auth.js";
import { readBody, route, send } from "./registry.js";

const staffRoles = new Set(["admin", "closer", "freelance"]);

extendAuthState((state) => {
  state.calls.account = [];
  state.account = {
    mode: { profile: "data", save: "ok", deletion: "data" },
    deletions: new Map(),
  };
});

route("POST", "/__auth/account-mode", async ({ request, response, url }) => {
  const account = stateFor(url.searchParams.get("tag") ?? "").account;
  Object.assign(account.mode, JSON.parse(await readBody(request)));
  return send(response, 200, { ok: true });
});

function failure(response, status, code, message) {
  return send(response, status, { code, message, details: null, hint: null });
}

function caller(request, response, name) {
  const session = bearer(request);
  if (!session) {
    send(response, 401, { code: "PGRST301", message: "JWT invalid" });
    return null;
  }
  session.auth.calls.account.push({ name });
  return session;
}

route("POST", "/rest/v1/rpc/update_my_profile", async ({ request, response }) => {
  const session = caller(request, response, "update_my_profile");
  if (!session) return;
  const body = JSON.parse(await readBody(request));
  session.auth.calls.account[session.auth.calls.account.length - 1].args = body;
  if (session.auth.account.mode.save === "error") {
    return failure(response, 500, "XX000", "internal");
  }
  const name = String(body.p_full_name ?? "").trim();
  if (name.length < 1 || name.length > 200) {
    return failure(response, 400, "23514", "invalid_full_name");
  }
  session.auth.profileEdits.set(session.userId, { full_name: name, locale: body.p_locale ?? "es" });
  return send(response, 200, "null");
});

function deletionCaller(request, response, name) {
  const session = caller(request, response, name);
  if (!session) return null;
  const { mode } = session.auth.account;
  if (mode.deletion === "missing") {
    failure(response, 404, "PGRST202", "function not found");
    return null;
  }
  if (mode.deletion === "error") {
    failure(response, 500, "XX000", "internal");
    return null;
  }
  const role = personById(session.userId)?.[1].role;
  const denied = role === "admin" || (staffRoles.has(role) && session.level !== "aal2");
  if (denied) {
    failure(response, 403, "42501", "forbidden");
    return null;
  }
  return session;
}

route("POST", "/rest/v1/rpc/my_account_deletion", ({ request, response }) => {
  const session = deletionCaller(request, response, "my_account_deletion");
  if (!session) return;
  return send(
    response,
    200,
    JSON.stringify(session.auth.account.deletions.get(session.userId) ?? null),
  );
});

route("POST", "/rest/v1/rpc/request_account_deletion", ({ request, response }) => {
  const session = deletionCaller(request, response, "request_account_deletion");
  if (!session) return;
  const { deletions } = session.auth.account;
  if (!deletions.has(session.userId)) deletions.set(session.userId, new Date().toISOString());
  return send(response, 200, JSON.stringify(deletions.get(session.userId)));
});

route("POST", "/rest/v1/rpc/cancel_account_deletion", ({ request, response }) => {
  const session = deletionCaller(request, response, "cancel_account_deletion");
  if (!session) return;
  const { deletions } = session.auth.account;
  if (!deletions.delete(session.userId))
    return failure(response, 400, "P0001", "request_not_found");
  return send(response, 200, "null");
});
