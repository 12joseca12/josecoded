import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

const port = Number(process.env.MOCK_BACKEND_PORT ?? 3199);
const acceptedSecret = "test-turnstile-secret";
const rejectedToken = "bad-token";

const fakeWidget = `
(function () {
  var store = {};
  function token() {
    try { return window.localStorage.getItem("fakeTurnstileToken") || "mock-token"; } catch (e) { return "mock-token"; }
  }
  function withAction(value, options) {
    return options.action && options.action !== "contact" ? value + ":" + options.action : value;
  }
  window.turnstile = {
    render: function (el, options) {
      var id = "fake-" + Object.keys(store).length;
      store[id] = options;
      el.setAttribute("data-fake-turnstile", "");
      setTimeout(function () { options.callback(withAction(token(), options)); }, 40);
      return id;
    },
    reset: function (id) {
      var options = store[id];
      if (options) setTimeout(function () { options.callback(withAction(token(), options)); }, 40);
    },
    remove: function (id) { delete store[id]; }
  };
})();
`;

let calls = { rpc: [], siteverify: [] };

const otpCode = "123456";
const totpCode = "654321";
const qrSvg =
  "data:image/svg+xml;utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#fff"/><rect x="1" y="1" width="2" height="2"/><rect x="5" y="1" width="2" height="2"/><rect x="1" y="5" width="2" height="2"/></svg>',
  );
const totpSecret = "JBSWY3DPEHPK3PXP";

const people = {
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
  },
  "client@example.com": {
    id: "00000000-0000-4000-8000-0000000000d1",
    role: "client",
    name: "Carla Client",
  },
  "inactive@example.com": {
    id: "00000000-0000-4000-8000-0000000000e1",
    role: "admin",
    name: "Ines Inactive",
    inactive: true,
  },
};

const seededLeads = [
  {
    id: "10000000-0000-4000-8000-000000000003",
    via: "pack",
    full_name: "Cara Pack",
    email: "cara@example.com",
    status: "new",
    created_at: "2026-11-03T09:30:00+00:00",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    via: "freelance",
    full_name: "Félix Freelance",
    email: "felix@example.com",
    status: "contacted",
    created_at: "2026-11-02T18:05:00+00:00",
  },
  {
    id: "10000000-0000-4000-8000-000000000001",
    via: "hiring",
    full_name: "Hilda Hiring",
    email: "hilda@example.com",
    status: "assigned",
    created_at: "2026-11-01T08:00:00+00:00",
  },
  {
    id: "10000000-0000-4000-8000-000000000000",
    via: null,
    full_name: "Nico Nexo",
    email: null,
    status: "discarded",
    created_at: "2026-10-30T12:00:00+00:00",
  },
];

const authStates = new Map();

function newAuthState() {
  const state = {
    calls: {
      captcha: [],
      otp: [],
      verify: [],
      enroll: [],
      factorVerify: [],
      logout: [],
      profiles: [],
      leads: [],
    },
    sessions: new Map(),
    refresh: new Map(),
    factors: new Map(),
    leadsMode: "data",
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
  return state;
}

function stateFor(tag) {
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

function personById(id) {
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
  const email = personById(userId)?.[0] ?? "";
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

function bearer(request) {
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

function authError(response, status, code, message) {
  return send(response, status, { code: status, error_code: code, msg: message });
}

function readBody(request) {
  return new Promise((resolve) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

function send(response, status, body, type = "application/json") {
  response.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  response.end(typeof body === "string" ? body : JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);

  if (url.pathname === "/__health") return send(response, 200, { ok: true });
  if (url.pathname === "/__calls") return send(response, 200, calls);
  if (url.pathname === "/__reset") {
    calls = { rpc: [], siteverify: [] };
    return send(response, 200, { ok: true });
  }

  if (url.pathname === "/__auth/reset") {
    authStates.delete(url.searchParams.get("tag") ?? "");
    return send(response, 200, { ok: true });
  }
  if (url.pathname === "/__auth/calls") {
    return send(response, 200, stateFor(url.searchParams.get("tag") ?? "").calls);
  }
  if (url.pathname === "/__auth/leads-mode" && request.method === "POST") {
    stateFor(url.searchParams.get("tag") ?? "").leadsMode = JSON.parse(
      await readBody(request),
    ).mode;
    return send(response, 200, { ok: true });
  }

  if (url.pathname === "/auth/v1/otp" && request.method === "POST") {
    const body = JSON.parse(await readBody(request));
    const { email, tag } = splitEmail(body.email);
    const auth = stateFor(tag);
    const captchaToken = String(body.gotrue_meta_security?.captcha_token ?? "");
    auth.calls.captcha.push({ token: captchaToken });
    if (captchaToken === "" || captchaToken.split(":")[0] === rejectedToken) {
      return authError(response, 400, "captcha_failed", "captcha protection: request disallowed");
    }
    auth.calls.otp.push({ email, create_user: body.create_user });
    if (email.startsWith("down@"))
      return authError(response, 500, "unexpected_failure", "internal");
    if (email.startsWith("ratelimit@")) {
      return authError(response, 429, "over_email_send_rate_limit", "rate limit");
    }
    if (!people[email])
      return authError(response, 422, "otp_disabled", "Signups not allowed for otp");
    return send(response, 200, {});
  }

  if (url.pathname === "/auth/v1/verify" && request.method === "POST") {
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
    return send(response, 200, issueSession(auth, person.id, "aal1"));
  }

  if (url.pathname === "/auth/v1/user" && request.method === "GET") {
    const session = bearer(request);
    if (!session) return authError(response, 401, "bad_jwt", "invalid JWT");
    return send(response, 200, userBody(session.auth, session.userId));
  }

  if (url.pathname === "/auth/v1/token" && request.method === "POST") {
    const body = JSON.parse(await readBody(request));
    const record = [...authStates.values()]
      .map((state) => state.refresh.get(body.refresh_token))
      .find((entry) => entry !== undefined);
    if (!record)
      return authError(response, 400, "refresh_token_not_found", "Invalid Refresh Token");
    return send(response, 200, issueSession(record.auth, record.userId, record.level));
  }

  if (url.pathname === "/auth/v1/logout" && request.method === "POST") {
    const session = bearer(request);
    const auth = session?.auth ?? stateFor("");
    auth.calls.logout.push({ scope: url.searchParams.get("scope") });
    if (session) session.active = false;
    response.writeHead(204);
    return response.end();
  }

  if (url.pathname === "/auth/v1/factors" && request.method === "POST") {
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
  }

  const factorMatch = /^\/auth\/v1\/factors\/([0-9a-f-]{36})(\/challenge|\/verify)?$/.exec(
    url.pathname,
  );
  if (factorMatch) {
    const session = bearer(request);
    if (!session) return authError(response, 401, "bad_jwt", "invalid JWT");
    const auth = session.auth;
    const list = auth.factors.get(session.userId) ?? [];
    const factor = list.find((entry) => entry.id === factorMatch[1]);
    if (!factor) return authError(response, 404, "mfa_factor_not_found", "factor not found");
    if (request.method === "DELETE" && !factorMatch[2]) {
      auth.factors.set(
        session.userId,
        list.filter((entry) => entry.id !== factor.id),
      );
      return send(response, 200, { id: factor.id });
    }
    if (request.method === "POST" && factorMatch[2] === "/challenge") {
      return send(response, 200, {
        id: randomUUID(),
        type: "totp",
        expires_at: Math.floor(Date.now() / 1000) + 300,
      });
    }
    if (request.method === "POST" && factorMatch[2] === "/verify") {
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
    }
  }

  if (url.pathname === "/rest/v1/profiles" && request.method === "GET") {
    const session = bearer(request);
    session?.auth.calls.profiles.push({ authenticated: true });
    if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
    const id = (url.searchParams.get("id") ?? "").replace("eq.", "");
    const found = personById(id);
    const row =
      found && found[1].id === session.userId
        ? {
            role: found[1].role,
            full_name: found[1].name,
            is_active: !found[1].inactive,
            archived_at: null,
          }
        : null;
    if ((request.headers.accept ?? "").includes("vnd.pgrst.object")) {
      if (!row) {
        return send(response, 406, {
          code: "PGRST116",
          message: "no rows",
          details: "0 rows",
          hint: null,
        });
      }
      return send(response, 200, row);
    }
    return send(response, 200, row ? [row] : []);
  }

  if (url.pathname === "/rest/v1/leads" && request.method === "GET") {
    const session = bearer(request);
    if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
    const auth = session.auth;
    auth.calls.leads.push({ authenticated: true, level: session.level });
    if (auth.leadsMode === "error") {
      return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
    }
    const found = personById(session.userId);
    const allowed = found?.[1].role === "admin" && session.level === "aal2";
    if (!allowed || auth.leadsMode === "empty") return send(response, 200, []);
    return send(response, 200, seededLeads);
  }

  if (url.pathname === "/turnstile/api.js") {
    return send(response, 200, fakeWidget, "text/javascript");
  }

  if (url.pathname === "/turnstile/siteverify" && request.method === "POST") {
    const params = new URLSearchParams(await readBody(request));
    const entry = Object.fromEntries(params.entries());
    calls.siteverify.push(entry);
    const [baseToken, widgetAction] = String(entry.response ?? "").split(":");
    const success = entry.secret === acceptedSecret && baseToken !== rejectedToken;
    return send(response, 200, {
      success,
      hostname: "localhost",
      action: widgetAction ?? "contact",
    });
  }

  if (url.pathname === "/rest/v1/rpc/submit_lead" && request.method === "POST") {
    const args = JSON.parse(await readBody(request));
    calls.rpc.push({
      args,
      authorization: request.headers.authorization ?? null,
      apikey: request.headers.apikey ?? null,
    });
    const email = String(args.p_email ?? "");
    if (email.startsWith("quota@")) {
      return send(response, 400, {
        code: "P0001",
        message: "form_quota_exceeded",
        details: null,
        hint: "contact_alternatives",
      });
    }
    if (email.startsWith("down@")) {
      return send(response, 500, {
        code: "XX000",
        message: "internal",
        details: null,
        hint: null,
      });
    }
    return send(response, 200, JSON.stringify("00000000-0000-4000-8000-000000000001"));
  }

  return send(response, 404, { message: "not found" });
});

server.listen(port, "127.0.0.1");
