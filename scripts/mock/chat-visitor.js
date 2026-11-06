import { randomUUID } from "node:crypto";

import { readBody, route, send } from "./registry.js";

const liveServiceKey = "test-service-role-key-chat";

const visitors = new Map();
const leads = [];
const calls = { send: [], handoff: [], thread: [] };

function postgrestError(response, status, message, hint = null) {
  return send(response, status, { code: "P0001", message, details: null, hint });
}

function keyOf(request) {
  return String(request.headers.apikey ?? "");
}

function visitorFor(tokenHash) {
  let visitor = visitors.get(tokenHash);
  if (!visitor) {
    visitor = {
      conversationId: randomUUID(),
      messages: [],
      aiEnabled: true,
      nexoOnline: false,
      pending: false,
      leadId: null,
      consentAt: null,
      status: "open",
      clock: 0,
      sentAt: 0,
    };
    visitors.set(tokenHash, visitor);
  }
  return visitor;
}

function stamp(visitor) {
  visitor.clock += 1;
  return new Date(Date.UTC(2026, 10, 5, 12, 0, 0) + visitor.clock * 1000).toISOString();
}

function push(visitor, row) {
  const message = {
    id: randomUUID(),
    author_kind: "human",
    from_staff: false,
    kind: "text",
    system_event: null,
    body: "",
    sources: [],
    auto: false,
    created_at: stamp(visitor),
    ...row,
  };
  visitor.messages.push(message);
  return message;
}

function snapshot(visitor, since) {
  return {
    messages: visitor ? visitor.messages.filter((entry) => !since || entry.created_at > since) : [],
    nexo_online: visitor?.nexoOnline ?? false,
    ai_enabled: visitor?.aiEnabled ?? true,
    pending_reply: visitor?.pending ?? false,
    handoff_done: visitor?.leadId != null,
    consent_at: visitor?.consentAt ?? null,
    status: visitor?.status ?? null,
  };
}

route("POST", "/rest/v1/rpc/read_public_settings", ({ request, response }) =>
  send(response, 200, [{ key: "public_chat", value: keyOf(request) === liveServiceKey }]),
);

route("POST", "/rest/v1/rpc/visitor_send", async ({ request, response }) => {
  const args = JSON.parse(await readBody(request));
  calls.send.push(args);
  const body = String(args.p_body ?? "").trim();
  if (keyOf(request) !== liveServiceKey) return postgrestError(response, 400, "public_chat_off");
  const token = String(args.p_token_hash ?? "");
  if (token.length < 32 || token.length > 128)
    return postgrestError(response, 400, "invalid_token");
  if (String(args.p_ip_hash ?? "").length < 16)
    return postgrestError(response, 400, "invalid_ip_hash");
  if (body === "") return postgrestError(response, 400, "empty_body");
  if (body.length > 2000) return postgrestError(response, 400, "body_too_long");
  if (body.startsWith("[down]")) {
    return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
  }
  if (body.startsWith("[quota]"))
    return postgrestError(response, 400, "chat_quota_exceeded", "visitor");
  if (body.startsWith("[burst]"))
    return postgrestError(response, 400, "chat_quota_exceeded", "burst");
  if (body.startsWith("[closed]")) return postgrestError(response, 400, "chat_closed");
  const visitor = visitorFor(token);
  if (visitor.status === "archived") return postgrestError(response, 400, "chat_closed");
  const message = push(visitor, { body, page_path: args.p_page_path });
  visitor.pending = visitor.aiEnabled;
  return send(response, 200, [{ conversation_id: visitor.conversationId, message_id: message.id }]);
});

route("POST", "/rest/v1/rpc/visitor_thread", async ({ request, response }) => {
  const args = JSON.parse(await readBody(request));
  calls.thread.push(args);
  const token = String(args.p_token_hash ?? "");
  if (token.length < 32 || token.length > 128)
    return postgrestError(response, 400, "invalid_token");
  return send(response, 200, snapshot(visitors.get(token), args.p_since ?? null));
});

route("POST", "/rest/v1/rpc/visitor_handoff", async ({ request, response }) => {
  const args = JSON.parse(await readBody(request));
  calls.handoff.push(args);
  const token = String(args.p_token_hash ?? "");
  if (token.length < 32) return postgrestError(response, 400, "invalid_token");
  if (args.p_consent !== true) return postgrestError(response, 400, "consent_required");
  const email = String(args.p_email ?? "").trim();
  const phone = String(args.p_phone ?? "").trim();
  if (email === "" && phone === "") return postgrestError(response, 400, "contact_required");
  if (email.startsWith("down@")) {
    return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
  }
  const visitor = visitors.get(token);
  if (!visitor || visitor.status !== "open") return postgrestError(response, 400, "chat_not_found");
  if (visitor.leadId) return send(response, 200, JSON.stringify(visitor.leadId));
  visitor.leadId = randomUUID();
  visitor.consentAt = new Date().toISOString();
  leads.push({
    id: visitor.leadId,
    source: "nexo",
    email,
    phone,
    name: String(args.p_name ?? ""),
    conversation_id: visitor.conversationId,
  });
  push(visitor, { author_kind: "system", system_event: "handoff_done" });
  return send(response, 200, JSON.stringify(visitor.leadId));
});

route("POST", "/__chat/omen", async ({ request, response }) => {
  const input = JSON.parse(await readBody(request));
  const visitor = visitors.get(String(input.tokenHash ?? ""));
  if (!visitor) return send(response, 404, { message: "unknown visitor" });
  switch (input.action) {
    case "online":
      visitor.nexoOnline = true;
      break;
    case "offline":
      visitor.nexoOnline = false;
      break;
    case "reply":
      push(visitor, {
        author_kind: "nexo",
        body: String(input.body ?? ""),
        sources: input.sources ?? [],
      });
      visitor.pending = false;
      break;
    case "staff":
      push(visitor, { from_staff: true, body: String(input.body ?? "") });
      break;
    case "takeover":
      visitor.aiEnabled = false;
      visitor.pending = false;
      push(visitor, { author_kind: "system", system_event: "ai_off" });
      break;
    case "archive":
      visitor.status = "archived";
      break;
    default:
      return send(response, 400, { message: "unknown action" });
  }
  return send(response, 200, { ok: true });
});

route("GET", "/__chat/calls", ({ response }) => send(response, 200, calls));

route("GET", "/__chat/leads", ({ response }) => send(response, 200, leads));
