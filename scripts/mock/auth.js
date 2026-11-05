import { randomUUID } from "node:crypto";

import { readBody, route, send, sendEmpty } from "./registry.js";

const rejectedToken = "bad-token";

const otpCode = "123456";
const totpCode = "654321";
const qrSvg =
  "data:image/svg+xml;utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#fff"/><rect x="1" y="1" width="2" height="2"/><rect x="5" y="1" width="2" height="2"/><rect x="1" y="5" width="2" height="2"/></svg>',
  );
const totpSecret = "JBSWY3DPEHPK3PXP";

export const people = {
  "admin@example.com": {
    id: "00000000-0000-4000-8000-0000000000a1",
    role: "admin",
    name: "Jose Admin",
  },
  "enrolled@example.com": {
    id: "00000000-0000-4000-8000-0000000000a2",
    role: "admin",
    name: "Jose Enrolled",
    factor: true,
  },
  "closer@example.com": {
    id: "00000000-0000-4000-8000-0000000000c1",
    role: "closer",
    name: "Cleo Closer",
    rates: { closer: 10, closerRecurring: 5 },
  },
  "dani@example.com": {
    id: "00000000-0000-4000-8000-0000000000c2",
    role: "closer",
    name: "Dani Closer",
    parent: "00000000-0000-4000-8000-0000000000c1",
    rates: { closer: 10, parent: 5, closerRecurring: 4, parentRecurring: 2 },
  },
  "client@example.com": {
    id: "00000000-0000-4000-8000-0000000000d1",
    role: "client",
    name: "Carla Client",
  },
  "invitee@example.com": {
    id: "00000000-0000-4000-8000-0000000000f1",
    role: "closer",
    name: "Ivy Invitee",
    noProfile: true,
  },
  "inactive@example.com": {
    id: "00000000-0000-4000-8000-0000000000e1",
    role: "admin",
    name: "Ines Inactive",
    inactive: true,
  },
};

const authStates = new Map();
const stateInitializers = [];

export function extendAuthState(initialize) {
  stateInitializers.push(initialize);
}

function newAuthState() {
  const state = {
    calls: {
      captcha: [],
      otp: [],
      verify: [],
      enroll: [],
      factorVerify: [],
      logout: [],
    },
    sessions: new Map(),
    refresh: new Map(),
    factors: new Map(),
    mailboxes: new Map(),
  };
  for (const person of Object.values(people)) {
    state.factors.set(
      person.id,
      person.factor
        ? [
            {
              id: randomUUID(),
              factor_type: "totp",
              status: "verified",
              friendly_name: "josecoded",
            },
          ]
        : [],
    );
  }
  for (const initialize of stateInitializers) initialize(state);
  return state;
}

export function stateFor(tag) {
  let state = authStates.get(tag);
  if (!state) {
    state = newAuthState();
    authStates.set(tag, state);
  }
  return state;
}

function splitEmail(raw) {
  const value = String(raw ?? "").toLowerCase();
  const match = /^([^+@]+)\+([a-z0-9]+)(@.+)$/.exec(value);
  if (!match) return { email: value, tag: "" };
  return { email: `${match[1]}${match[3]}`, tag: match[2] };
}

function b64(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function personById(id) {
  return Object.entries(people).find(([, person]) => person.id === id);
}

function userBody(auth, id) {
  const found = personById(id);
  const email = found ? found[0] : "";
  const now = new Date().toISOString();
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email,
    email_confirmed_at: now,
    phone: "",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    identities: [],
    factors: auth.factors.get(id) ?? [],
    created_at: now,
    updated_at: now,
  };
}

function issueSession(auth, userId, level) {
  const sessionId = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const email = auth.mailboxes.get(userId) ?? personById(userId)?.[0] ?? "";
  const amr =
    level === "aal2"
      ? [
          { method: "totp", timestamp: now },
          { method: "otp", timestamp: now },
        ]
      : [{ method: "otp", timestamp: now }];
  const payload = {
    sub: userId,
    email,
    role: "authenticated",
    aud: "authenticated",
    aal: level,
    amr,
    session_id: sessionId,
    iat: now,
    exp: now + 3600,
  };
  const accessToken = `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.mock-signature`;
  const refreshToken = randomUUID().slice(0, 12);
  auth.sessions.set(accessToken, { userId, level, sessionId, active: true, auth });
  auth.refresh.set(refreshToken, { userId, level, sessionId, auth });
  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: refreshToken,
    user: userBody(auth, userId),
  };
}

export function bearer(request) {
  const header = request.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = [...authStates.values()]
    .map((state) => state.sessions.get(token))
    .find((entry) => entry !== undefined);
  if (!session?.active) return null;
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
  if (payload.exp < Date.now() / 1000) return null;
  return session;
}

export function authError(response, status, code, message) {
  return send(response, status, { code: status, error_code: code, msg: message });
}

route("POST", "/__auth/reset", ({ response, url }) => {
  authStates.delete(url.searchParams.get("tag") ?? "");
  return send(response, 200, { ok: true });
});

route("GET", "/__auth/calls", ({ response, url }) =>
  send(response, 200, stateFor(url.searchParams.get("tag") ?? "").calls),
);

route("POST", "/auth/v1/otp", async ({ request, response }) => {
  const body = JSON.parse(await readBody(request));
  const { email, tag } = splitEmail(body.email);
  const auth = stateFor(tag);
  const captchaToken = String(body.gotrue_meta_security?.captcha_token ?? "");
  auth.calls.captcha.push({ token: captchaToken });
  if (captchaToken === "" || captchaToken.split(":")[0] === rejectedToken) {
    return authError(response, 400, "captcha_failed", "captcha protection: request disallowed");
  }
  auth.calls.otp.push({ email, create_user: body.create_user });
  if (email.startsWith("down@")) return authError(response, 500, "unexpected_failure", "internal");
  if (email.startsWith("ratelimit@")) {
    return authError(response, 429, "over_email_send_rate_limit", "rate limit");
  }
  if (!people[email])
    return authError(response, 422, "otp_disabled", "Signups not allowed for otp");
  return send(response, 200, {});
});

route("POST", "/auth/v1/verify", async ({ request, response }) => {
  const body = JSON.parse(await readBody(request));
  const { email, tag } = splitEmail(body.email);
  const auth = stateFor(tag);
  auth.calls.verify.push({ email, token: body.token, type: body.type });
  if (email.startsWith("limited@")) {
    return authError(response, 429, "over_request_rate_limit", "rate limit");
  }
  const person = people[email];
  if (!person || body.token !== otpCode) {
    return authError(response, 403, "otp_expired", "Token has expired or is invalid");
  }
  auth.mailboxes.set(person.id, String(body.email).toLowerCase());
  return send(response, 200, issueSession(auth, person.id, "aal1"));
});

route("GET", "/auth/v1/user", ({ request, response }) => {
  const session = bearer(request);
  if (!session) return authError(response, 401, "bad_jwt", "invalid JWT");
  return send(response, 200, userBody(session.auth, session.userId));
});

route("POST", "/auth/v1/token", async ({ request, response }) => {
  const body = JSON.parse(await readBody(request));
  const record = [...authStates.values()]
    .map((state) => state.refresh.get(body.refresh_token))
    .find((entry) => entry !== undefined);
  if (!record) return authError(response, 400, "refresh_token_not_found", "Invalid Refresh Token");
  return send(response, 200, issueSession(record.auth, record.userId, record.level));
});

route("POST", "/auth/v1/logout", ({ request, response, url }) => {
  const session = bearer(request);
  const auth = session?.auth ?? stateFor("");
  auth.calls.logout.push({ scope: url.searchParams.get("scope") });
  if (session) session.active = false;
  return sendEmpty(response);
});

route("POST", "/auth/v1/factors", async ({ request, response }) => {
  const session = bearer(request);
  if (!session) return authError(response, 401, "bad_jwt", "invalid JWT");
  const auth = session.auth;
  const body = JSON.parse(await readBody(request));
  const list = auth.factors.get(session.userId) ?? [];
  auth.calls.enroll.push({ friendly_name: body.friendly_name, issuer: body.issuer });
  if (list.some((factor) => factor.friendly_name === body.friendly_name)) {
    return authError(response, 422, "mfa_factor_name_conflict", "friendly name conflict");
  }
  const factor = {
    id: randomUUID(),
    factor_type: "totp",
    status: "unverified",
    friendly_name: body.friendly_name,
  };
  list.push(factor);
  auth.factors.set(session.userId, list);
  return send(response, 200, {
    id: factor.id,
    type: "totp",
    friendly_name: factor.friendly_name,
    totp: {
      qr_code: qrSvg,
      secret: totpSecret,
      uri: `otpauth://totp/josecoded?secret=${totpSecret}`,
    },
  });
});

const factorPath = /^\/auth\/v1\/factors\/([0-9a-f-]{36})(\/challenge|\/verify)?$/;

function factorFor(request, response, factorId) {
  const session = bearer(request);
  if (!session) {
    authError(response, 401, "bad_jwt", "invalid JWT");
    return null;
  }
  const auth = session.auth;
  const list = auth.factors.get(session.userId) ?? [];
  const factor = list.find((entry) => entry.id === factorId);
  if (!factor) {
    authError(response, 404, "mfa_factor_not_found", "factor not found");
    return null;
  }
  return { session, auth, list, factor };
}

route("DELETE", factorPath, ({ request, response, match }) => {
  if (match[2]) return send(response, 404, { message: "not found" });
  const found = factorFor(request, response, match[1]);
  if (!found) return;
  const { session, auth, list, factor } = found;
  auth.factors.set(
    session.userId,
    list.filter((entry) => entry.id !== factor.id),
  );
  return send(response, 200, { id: factor.id });
});

route("POST", factorPath, async ({ request, response, match }) => {
  if (!match[2]) return send(response, 404, { message: "not found" });
  const found = factorFor(request, response, match[1]);
  if (!found) return;
  const { session, auth, factor } = found;
  if (match[2] === "/challenge") {
    return send(response, 200, {
      id: randomUUID(),
      type: "totp",
      expires_at: Math.floor(Date.now() / 1000) + 300,
    });
  }
  const body = JSON.parse(await readBody(request));
  auth.calls.factorVerify.push({ factorId: factor.id, code: body.code });
  if (body.code === "000000") {
    return authError(response, 429, "over_request_rate_limit", "rate limit");
  }
  if (body.code !== totpCode) {
    return authError(response, 400, "mfa_verification_failed", "Invalid TOTP code entered");
  }
  factor.status = "verified";
  return send(response, 200, issueSession(auth, session.userId, "aal2"));
});
