import { bearer, extendAuthState, stateFor } from "./auth.js";
import { readBody, route, send } from "./registry.js";

const serviceKey = "test-service-role-key";
const day = 24 * 60 * 60 * 1000;
const tokenPattern = /^([0-9a-f]{12})-([a-z]+)$/;

extendAuthState((state) => {
  state.calls.accept = [];
  state.accepted = new Set();
  state.acceptFailure = null;
});

route("POST", "/__auth/accept-failure", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").acceptFailure = JSON.parse(
    await readBody(request),
  ).message;
  return send(response, 200, { ok: true });
});

function lookup(token) {
  const match = tokenPattern.exec(String(token));
  if (!match) return null;
  const [, tag, kind] = match;
  const now = Date.now();
  const base = {
    role: "closer",
    invited_by_name: "Jose Enrolled",
    email: `invitee+${tag}@example.com`,
    expires_at: new Date(now + 5 * day).toISOString(),
    status: "pending",
  };
  const kinds = {
    pending: base,
    client: { ...base, role: "client" },
    other: { ...base, email: `other+${tag}@example.com` },
    expired: { ...base, expires_at: new Date(now - 2 * day).toISOString(), status: "expired" },
    used: { ...base, status: "accepted" },
    revoked: { ...base, status: "revoked" },
  };
  const row = kinds[kind];
  if (!row) return null;
  const auth = stateFor(tag);
  return { auth, row: auth.accepted.has(token) ? { ...row, status: "accepted" } : row };
}

function failure(response, message) {
  return send(response, 400, { code: "P0001", message, details: null, hint: null });
}

route("POST", "/rest/v1/rpc/read_invitation", async ({ request, response }) => {
  if (request.headers.authorization !== `Bearer ${serviceKey}`) {
    return send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
  }
  const { p_token: token } = JSON.parse(await readBody(request));
  const found = lookup(token);
  return send(response, 200, found ? [found.row] : []);
});

route("POST", "/rest/v1/rpc/accept_invitation", async ({ request, response }) => {
  const session = bearer(request);
  if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
  const auth = session.auth;
  const args = JSON.parse(await readBody(request));
  auth.calls.accept.push(args);
  if (auth.acceptFailure) return failure(response, auth.acceptFailure);
  const found = lookup(args.p_token);
  if (!found) return failure(response, "invitation_not_found");
  const { row } = found;
  if (row.status === "accepted") return failure(response, "invitation_used");
  if (row.status === "revoked") return failure(response, "invitation_revoked");
  if (row.status === "expired") return failure(response, "invitation_expired");
  if ((auth.mailboxes.get(session.userId) ?? "") !== row.email) {
    return failure(response, "invitation_email_mismatch");
  }
  if (auth.profiles.has(session.userId)) return failure(response, "profile_exists");
  const fullName = String(args.p_full_name ?? "").trim();
  if (fullName === "" || fullName.length > 200) return failure(response, "invalid_full_name");
  auth.profiles.set(session.userId, { role: row.role, full_name: fullName });
  auth.accepted.add(args.p_token);
  return send(response, 200, JSON.stringify(row.role));
});
