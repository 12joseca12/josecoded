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
