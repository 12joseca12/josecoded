import { bearer, extendAuthState, personById, stateFor } from "./auth.js";
import { readBody, route, send } from "./registry.js";

const staffRoles = new Set(["admin", "closer", "freelance"]);
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const events = [
  "lead_new",
  "lead_claimed",
  "message_new",
  "commission_accrued",
  "payment_recorded",
  "payment_overdue",
  "payout_paid",
  "job_failed",
  "omen_down",
  "invitation_accepted",
];
const channels = new Set(["telegram", "email", "bell"]);
const codeMinutes = 15;

const codeOwners = new Map();
let codeCounter = 0;

function freshNotifications() {
  return {
    mode: { prefs: "data", status: "data", action: "ok" },
    prefs: new Map(),
    links: new Map(),
    codes: new Map(),
  };
}

extendAuthState((state) => {
  state.calls.notifications = [];
  state.notifications = freshNotifications();
});

function member(request) {
  const session = bearer(request);
  if (!session) return { denied: "unauthenticated" };
  const role = personById(session.userId)?.[1].role;
  const allowed = staffRoles.has(role) && session.level === "aal2";
  return allowed ? { session } : { session, denied: "forbidden" };
}

function deny(response, who) {
  if (who.denied === "unauthenticated") {
    return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
  }
  return send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
}

function failure(response, code = "XX000", message = "internal") {
  return send(response, code === "XX000" ? 500 : 404, { code, message, details: null, hint: null });
}

function rpcError(response, message) {
  return send(response, 400, { code: "P0001", message, details: null, hint: null });
}

export function mailboxTag(auth, userId) {
  const mailbox = auth.mailboxes.get(userId) ?? "";
  return /\+([a-z0-9]+)@/.exec(mailbox)?.[1] ?? "";
}

function newCode() {
  codeCounter += 1;
  let value = codeCounter * 2654435761;
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[value % alphabet.length];
    value = Math.floor(value / alphabet.length) + index + 7;
  }
  return code;
}

function pendingCode(notifications, userId) {
  const entry = notifications.codes.get(userId);
  return entry && entry.expiresAt > Date.now() ? entry : null;
}

function statusRow(notifications, userId) {
  const link = notifications.links.get(userId);
  const code = pendingCode(notifications, userId);
  return {
    linked_at: link ? link.linkedAt : null,
    pending_code: code ? code.code : null,
    pending_expires_at: code ? new Date(code.expiresAt).toISOString() : null,
  };
}

route("POST", "/__auth/notifications-mode", async ({ request, response, url }) => {
  Object.assign(
    stateFor(url.searchParams.get("tag") ?? "").notifications.mode,
    JSON.parse(await readBody(request)),
  );
  return send(response, 200, { ok: true });
});

route("POST", "/__auth/telegram-confirm", async ({ request, response, url }) => {
  const auth = stateFor(url.searchParams.get("tag") ?? "");
  const { userId, chatId = 4242 } = JSON.parse(await readBody(request));
  auth.notifications.links.set(userId, {
    chatId,
    linkedAt: new Date().toISOString(),
  });
  auth.notifications.codes.delete(userId);
  return send(response, 200, { ok: true });
});

route("GET", "/rest/v1/notification_prefs", ({ request, response, url }) => {
  const who = member(request);
  if (who.denied === "unauthenticated") return deny(response, who);
  const { auth } = who.session;
  const { notifications } = auth;
  auth.calls.notifications.push({ name: "notification_prefs", level: who.session.level });
  if (notifications.mode.prefs === "error") return failure(response);
  if (notifications.mode.prefs === "missing") return failure(response, "PGRST205", "no table");
  if (who.denied) return send(response, 200, []);
  const filter = /^eq\.(.+)$/.exec(url.searchParams.get("user_id") ?? "");
  const userId = filter ? filter[1] : who.session.userId;
  const stored = notifications.prefs.get(userId) ?? new Map();
  const rows = [...stored.entries()].map(([event, value]) => ({ event, ...value }));
  return send(response, 200, rows);
});

route("POST", "/rest/v1/rpc/telegram_link_status", ({ request, response }) => {
  const who = member(request);
  if (who.denied) return deny(response, who);
  const { auth } = who.session;
  const { notifications } = auth;
  auth.calls.notifications.push({ name: "telegram_link_status", level: who.session.level });
  if (notifications.mode.status === "error") return failure(response);
  if (notifications.mode.status === "missing") return failure(response, "PGRST202", "no function");
  return send(response, 200, [statusRow(notifications, who.session.userId)]);
});

route("POST", "/rest/v1/rpc/telegram_link_code", ({ request, response }) => {
  const who = member(request);
  if (who.denied) return deny(response, who);
  const { auth } = who.session;
  const { notifications } = auth;
  auth.calls.notifications.push({ name: "telegram_link_code", level: who.session.level });
  if (notifications.mode.action === "error") return failure(response);
  const code = newCode();
  notifications.codes.set(who.session.userId, {
    code,
    expiresAt: Date.now() + codeMinutes * 60_000,
  });
  codeOwners.set(code, { tag: mailboxTag(auth, who.session.userId), userId: who.session.userId });
  return send(response, 200, JSON.stringify(code));
});

route("POST", "/rest/v1/rpc/telegram_unlink", ({ request, response }) => {
  const who = member(request);
  if (who.denied) return deny(response, who);
  const { auth } = who.session;
  const { notifications } = auth;
  auth.calls.notifications.push({ name: "telegram_unlink", level: who.session.level });
  if (notifications.mode.action === "error") return failure(response);
  notifications.links.delete(who.session.userId);
  notifications.codes.delete(who.session.userId);
  return send(response, 204, "");
});

route("POST", "/rest/v1/rpc/set_notification_pref", async ({ request, response }) => {
  const who = member(request);
  if (who.denied) return deny(response, who);
  const { auth } = who.session;
  const { notifications } = auth;
  const args = JSON.parse(await readBody(request));
  auth.calls.notifications.push({ name: "set_notification_pref", args, level: who.session.level });
  if (notifications.mode.action === "error") return failure(response);
  if (!events.includes(args.p_event)) return rpcError(response, "invalid_event");
  if (!channels.has(args.p_channel)) return rpcError(response, "invalid_channel");
  const stored = notifications.prefs.get(who.session.userId) ?? new Map();
  const current = stored.get(args.p_event) ?? { telegram: true, email: true, bell: true };
  stored.set(args.p_event, { ...current, [args.p_channel]: args.p_enabled });
  notifications.prefs.set(who.session.userId, stored);
  return send(response, 204, "");
});

export const outbox = [];
let outboxId = 0;

export function enqueue(tag, item) {
  outboxId += 1;
  const row = {
    id: outboxId,
    tag,
    channel: item.channel,
    recipient: item.recipient,
    template: item.template,
    payload: item.payload ?? {},
    status: "queued",
    attempts: 0,
    last_error: null,
  };
  outbox.push(row);
  return row;
}

route("GET", "/__auth/outbox", ({ response, url }) => {
  const tag = url.searchParams.get("tag") ?? "";
  return send(
    response,
    200,
    outbox.filter((row) => row.tag === tag),
  );
});

route("POST", "/__auth/outbox-clear", ({ response, url }) => {
  const tag = url.searchParams.get("tag") ?? "";
  for (let index = outbox.length - 1; index >= 0; index -= 1) {
    if (outbox[index].tag === tag) outbox.splice(index, 1);
  }
  return send(response, 200, { ok: true });
});

route("POST", "/__auth/outbox-seed", async ({ request, response, url }) => {
  const tag = url.searchParams.get("tag") ?? "";
  const items = JSON.parse(await readBody(request));
  return send(
    response,
    200,
    items.map((item) => enqueue(tag, item)),
  );
});

route("POST", "/rest/v1/rpc/send_test_notification", async ({ request, response }) => {
  const who = member(request);
  if (who.denied) return deny(response, who);
  const { auth } = who.session;
  const { notifications } = auth;
  const args = JSON.parse(await readBody(request));
  auth.calls.notifications.push({
    name: "send_test_notification",
    args,
    level: who.session.level,
  });
  if (notifications.mode.action === "error") return failure(response);
  const tag = mailboxTag(auth, who.session.userId);
  if (args.p_channel === "email") {
    const email = auth.mailboxes.get(who.session.userId) ?? "";
    enqueue(tag, { channel: "email", recipient: email, template: "test" });
  } else if (args.p_channel === "telegram") {
    const link = notifications.links.get(who.session.userId);
    if (!link) return rpcError(response, "telegram_not_linked");
    enqueue(tag, { channel: "telegram", recipient: String(link.chatId), template: "test" });
  } else {
    return rpcError(response, "invalid_channel");
  }
  return send(response, 204, "");
});

const serviceKey = "test-service-role-key";
const resendKey = "re_test_key";
const botToken = "123456:test-bot-token";
const maxAttempts = 5;
const fakes = [];
const chatTags = new Map();
const chatOwners = new Map();
const hits = new Map();

function service(request, response) {
  if (request.headers.authorization === `Bearer ${serviceKey}`) return true;
  send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
  return false;
}

function hit(key) {
  const count = (hits.get(key) ?? 0) + 1;
  hits.set(key, count);
  return count;
}

route("POST", "/rest/v1/rpc/outbox_claim", async ({ request, response }) => {
  if (!service(request, response)) return;
  const { p_limit: limit } = JSON.parse(await readBody(request));
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return rpcError(response, "invalid_limit");
  }
  const picked = outbox.filter((row) => row.status === "queued").slice(0, limit);
  for (const row of picked) row.status = "sending";
  return send(
    response,
    200,
    picked.map(({ id, channel, recipient, template, payload, attempts }) => ({
      id,
      channel,
      recipient,
      template,
      payload,
      attempts,
    })),
  );
});

route("POST", "/rest/v1/rpc/outbox_mark", async ({ request, response }) => {
  if (!service(request, response)) return;
  const args = JSON.parse(await readBody(request));
  const row = outbox.find((entry) => entry.id === args.p_id && entry.status === "sending");
  if (!row) return rpcError(response, "outbox_item_not_sending");
  if (args.p_ok) {
    row.status = "sent";
    row.last_error = null;
  } else {
    row.attempts += 1;
    row.status = row.attempts >= maxAttempts ? "failed" : "queued";
    row.last_error = String(args.p_error ?? "unknown").slice(0, 1000);
  }
  return send(response, 204, "");
});

route("POST", "/rest/v1/rpc/telegram_confirm_link", async ({ request, response }) => {
  if (!service(request, response)) return;
  const args = JSON.parse(await readBody(request));
  const code = String(args.p_code ?? "").toUpperCase();
  const owner = codeOwners.get(code);
  const auth = owner ? stateFor(owner.tag) : null;
  const entry = owner ? auth.notifications.codes.get(owner.userId) : null;
  if (!entry || entry.code !== code || entry.expiresAt <= Date.now()) {
    return rpcError(response, "code_invalid_or_expired");
  }
  const taken = chatOwners.get(args.p_chat_id);
  if (taken && taken.userId !== owner.userId) return rpcError(response, "chat_already_linked");
  auth.notifications.links.set(owner.userId, {
    chatId: args.p_chat_id,
    linkedAt: new Date().toISOString(),
  });
  auth.notifications.codes.delete(owner.userId);
  chatOwners.set(args.p_chat_id, owner);
  chatTags.set(String(args.p_chat_id), owner.tag);
  return send(response, 200, JSON.stringify(owner.userId));
});

route("POST", "/__auth/telegram-code", async ({ request, response, url }) => {
  const tag = url.searchParams.get("tag") ?? "";
  const { userId } = JSON.parse(await readBody(request));
  const code = newCode();
  stateFor(tag).notifications.codes.set(userId, {
    code,
    expiresAt: Date.now() + codeMinutes * 60_000,
  });
  codeOwners.set(code, { tag, userId });
  return send(response, 200, { code });
});

route("GET", "/__auth/fakes", ({ response, url }) => {
  const tag = url.searchParams.get("tag") ?? "";
  return send(
    response,
    200,
    fakes.filter((entry) => entry.tag === tag),
  );
});

route("POST", "/resend/emails", async ({ request, response }) => {
  if (request.headers.authorization !== `Bearer ${resendKey}`) {
    return send(response, 401, { name: "missing_api_key", message: "API key is invalid" });
  }
  const body = JSON.parse(await readBody(request));
  const key = String(request.headers["idempotency-key"] ?? "");
  const to = String(body.to?.[0] ?? "");
  if (to.startsWith("bounce")) {
    return send(response, 422, { name: "validation_error", message: "Invalid `to` field" });
  }
  if (to.startsWith("flaky") && hit(`resend:${key}`) === 1) {
    return send(response, 500, { name: "internal_server_error", message: "try again" });
  }
  const id = Number(key.replace("outbox-", ""));
  const row = outbox.find((entry) => entry.id === id);
  const tag = row?.tag ?? /\+([a-z0-9]+)@/.exec(to)?.[1] ?? "";
  fakes.push({
    tag,
    kind: "email",
    to,
    from: body.from,
    subject: body.subject,
    text: body.text,
    html: body.html,
    key,
  });
  return send(response, 200, { id: `fake-${fakes.length}` });
});

route("POST", /^\/telegram\/bot([^/]+)\/sendMessage$/, async ({ request, response, match }) => {
  if (match[1] !== botToken) {
    return send(response, 401, { ok: false, error_code: 401, description: "Unauthorized" });
  }
  const body = JSON.parse(await readBody(request));
  const chat = String(body.chat_id);
  if (chat === "403000") {
    return send(response, 403, {
      ok: false,
      error_code: 403,
      description: "Forbidden: bot was blocked by the user",
    });
  }
  if (chat === "429000" && hit(`telegram:${chat}`) === 1) {
    return send(response, 429, {
      ok: false,
      error_code: 429,
      description: "Too Many Requests: retry after 1",
      parameters: { retry_after: 1 },
    });
  }
  const row = outbox.find((entry) => entry.recipient === chat && entry.status === "sending");
  const tag = chatTags.get(chat) ?? row?.tag ?? "";
  fakes.push({ tag, kind: "telegram", to: chat, text: body.text });
  return send(response, 200, { ok: true, result: { message_id: fakes.length } });
});
