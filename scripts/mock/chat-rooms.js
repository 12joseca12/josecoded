import { randomUUID } from "node:crypto";

import { bearer, extendAuthState, people, personById, stateFor } from "./auth.js";
import { readBody, route, send, sendEmpty } from "./registry.js";

const adminIds = [people["admin@example.com"].id, people["enrolled@example.com"].id];
const closerId = people["closer@example.com"].id;
const daniId = people["dani@example.com"].id;
const clientId = people["client@example.com"].id;

export const roomIds = {
  closer: "c0000000-0000-4000-8000-000000000001",
  visitor: "c0000000-0000-4000-8000-000000000002",
  client: "c0000000-0000-4000-8000-000000000003",
  archived: "c0000000-0000-4000-8000-000000000004",
};

const names = {
  [adminIds[0]]: "Jose Admin",
  [adminIds[1]]: "Jose Enrolled",
  [closerId]: "Cleo Closer",
  [daniId]: "Dani Closer",
  [clientId]: "Carla Client",
};

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function member(userId, role, extra = {}) {
  return {
    user_id: userId,
    role,
    full_name: names[userId],
    can_write: true,
    joined_at: minutesAgo(600),
    left_at: null,
    last_read_at: null,
    ...extra,
  };
}

function message(room, fields) {
  return {
    id: randomUUID(),
    conversation_id: room,
    author_kind: "human",
    author_id: null,
    kind: "text",
    system_event: null,
    body: "",
    sources: [],
    auto: false,
    message_attachments: [],
    created_at: new Date().toISOString(),
    ...fields,
  };
}

function owners() {
  return adminIds.map((id) => member(id, "owner"));
}

const allRooms = new Set();

function findMessage(id) {
  for (const room of allRooms) {
    const entry = room.messages.find((candidate) => candidate.id === id);
    if (entry) return { room, entry };
  }
  return null;
}

function freshRooms() {
  const rooms = new Map();
  rooms.set(roomIds.closer, {
    id: roomIds.closer,
    kind: "closer",
    status: "open",
    ai_enabled: true,
    ai_off_reason: null,
    consent_at: null,
    consent_revoked_at: null,
    project_id: null,
    subject: closerId,
    lead_id: null,
    contact_id: null,
    first_page_path: null,
    members: [...owners(), member(closerId, "closer")],
    messages: [
      message(roomIds.closer, {
        author_id: closerId,
        body: "Hola Jose, tengo una duda.",
        created_at: minutesAgo(50),
      }),
      message(roomIds.closer, {
        author_id: adminIds[1],
        body: "Dime.",
        created_at: minutesAgo(45),
      }),
      message(roomIds.closer, {
        author_kind: "nexo",
        body: "Respondo yo, Nexo.",
        auto: true,
        created_at: minutesAgo(30),
      }),
    ],
  });
  rooms.set(roomIds.visitor, {
    id: roomIds.visitor,
    kind: "visitor",
    status: "open",
    ai_enabled: true,
    ai_off_reason: null,
    consent_at: null,
    consent_revoked_at: null,
    project_id: null,
    subject: null,
    lead_id: null,
    contact_id: null,
    first_page_path: "/es/servicios",
    members: owners(),
    messages: [
      message(roomIds.visitor, { body: "Hola, cuanto cuesta una web?", created_at: minutesAgo(5) }),
    ],
  });
  rooms.set(roomIds.client, {
    id: roomIds.client,
    kind: "client",
    status: "open",
    ai_enabled: true,
    ai_off_reason: null,
    consent_at: null,
    consent_revoked_at: null,
    project_id: "d0000000-0000-4000-8000-000000000001",
    subject: null,
    lead_id: null,
    contact_id: null,
    first_page_path: null,
    members: [...owners(), member(clientId, "client"), member(closerId, "closer")],
    messages: [
      message(roomIds.client, {
        author_id: clientId,
        body: "Buenos dias, ya tengo el logo.",
        created_at: minutesAgo(20),
      }),
    ],
  });
  rooms.set(roomIds.archived, {
    id: roomIds.archived,
    kind: "closer",
    status: "archived",
    ai_enabled: true,
    ai_off_reason: null,
    consent_at: null,
    consent_revoked_at: null,
    project_id: null,
    subject: daniId,
    lead_id: null,
    contact_id: null,
    first_page_path: null,
    members: [...owners(), member(daniId, "closer", { left_at: minutesAgo(100) })],
    messages: [
      message(roomIds.archived, {
        author_id: daniId,
        body: "Hasta pronto.",
        created_at: minutesAgo(200),
      }),
      message(roomIds.archived, {
        author_kind: "system",
        system_event: "archived",
        body: "",
        created_at: minutesAgo(100),
      }),
    ],
  });
  for (const room of rooms.values()) allRooms.add(room);
  return rooms;
}

extendAuthState((state) => {
  state.calls.chat = [];
  state.chat = {
    mode: { messages: "data", send: "ok", summaries: "data", storage: "ok" },
    rooms: freshRooms(),
    storage: [],
  };
});

route("POST", "/__chat/mode", async ({ request, response, url }) => {
  Object.assign(
    stateFor(url.searchParams.get("tag") ?? "").chat.mode,
    JSON.parse(await readBody(request)),
  );
  return send(response, 200, { ok: true });
});

route("POST", "/__chat/push", async ({ request, response, url }) => {
  const { chat } = stateFor(url.searchParams.get("tag") ?? "");
  const {
    room,
    body = "",
    author = null,
    kind = "human",
    system_event = null,
  } = JSON.parse(await readBody(request));
  const target = chat.rooms.get(room);
  if (!target) return send(response, 404, { ok: false });
  const fields = { author_kind: kind, author_id: author, body, system_event };
  target.messages.push(message(room, fields));
  return send(response, 200, { ok: true });
});

route("POST", "/__chat/room", async ({ request, response, url }) => {
  const { chat } = stateFor(url.searchParams.get("tag") ?? "");
  const { room, set } = JSON.parse(await readBody(request));
  const target = chat.rooms.get(room);
  if (!target) return send(response, 404, { ok: false });
  Object.assign(target, set);
  return send(response, 200, { ok: true });
});

route("GET", "/__chat/calls", ({ response, url }) => {
  const { calls } = stateFor(url.searchParams.get("tag") ?? "");
  return send(response, 200, calls.chat);
});

function caller(request) {
  const session = bearer(request);
  if (!session) return { denied: 401 };
  const person = personById(session.userId)?.[1];
  if (!person) return { denied: 401 };
  return { session, person, auth: session.auth, level: session.level };
}

function rejection(response, status, code, message = "forbidden") {
  return send(response, status, { code, message, details: null, hint: null });
}

function canRead(who, room) {
  if (who.person.role !== "client" && who.level !== "aal2") return false;
  if (who.person.role === "admin") return true;
  return room.members.some(
    (entry) => entry.user_id === who.session.userId && entry.left_at === null,
  );
}

function canWrite(who, room) {
  if (!canRead(who, room) || room.status !== "open") return false;
  const row = room.members.find((entry) => entry.user_id === who.session.userId);
  return row ? row.can_write : false;
}

function unread(room, userId) {
  const row = room.members.find((entry) => entry.user_id === userId);
  const readAt = row?.last_read_at ? Date.parse(row.last_read_at) : null;
  return room.messages.filter(
    (entry) =>
      entry.author_kind !== "system" &&
      entry.author_id !== userId &&
      (readAt === null || Date.parse(entry.created_at) > readAt),
  ).length;
}

function consentState(room) {
  if (room.kind !== "client") return "n/a";
  if (room.consent_at && !room.consent_revoked_at) return "granted";
  if (room.consent_revoked_at) return "revoked";
  return "pending";
}

function summary(room, userId) {
  const visible = room.messages.filter((entry) => entry.author_kind !== "system");
  const last = visible.at(-1);
  return {
    id: room.id,
    kind: room.kind,
    status: room.status,
    last_activity_at: room.messages.at(-1)?.created_at ?? minutesAgo(1000),
    last_message_excerpt: last ? last.body.slice(0, 140) : null,
    unread_count: unread(room, userId),
    ai_active: room.ai_enabled && (room.kind !== "client" || consentState(room) === "granted"),
    ai_enabled: room.ai_enabled,
    consent_state: consentState(room),
    counterpart_name: room.subject ? names[room.subject] : null,
    first_page_path: room.first_page_path,
    project_id: room.project_id,
  };
}

route("GET", "/rest/v1/messages", ({ request, response, url }) => {
  const who = caller(request);
  if (who.denied) return rejection(response, 401, "PGRST301", "JWT invalid");
  const { chat } = who.auth;
  who.auth.calls.chat.push({ name: "messages_list", query: url.search });
  if (chat.mode.messages === "error") return rejection(response, 500, "XX000", "internal");
  const roomId = /^eq\.(.+)$/.exec(url.searchParams.get("conversation_id") ?? "")?.[1];
  const room = roomId ? chat.rooms.get(roomId) : null;
  if (!room || !canRead(who, room)) return send(response, 200, []);
  const after = /^gt\.(.+)$/.exec(url.searchParams.get("created_at") ?? "")?.[1];
  const ascending = (url.searchParams.get("order") ?? "").startsWith("created_at.asc");
  const limit = Number(url.searchParams.get("limit") ?? 100);
  const rows = room.messages
    .filter((entry) => !after || Date.parse(entry.created_at) > Date.parse(after))
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .slice();
  if (!ascending) rows.reverse();
  return send(response, 200, rows.slice(0, limit));
});

route("POST", "/rest/v1/messages", async ({ request, response }) => {
  const who = caller(request);
  if (who.denied) return rejection(response, 401, "PGRST301", "JWT invalid");
  const { chat } = who.auth;
  const body = JSON.parse(await readBody(request));
  const room = chat.rooms.get(body.conversation_id);
  if (chat.mode.send === "error") return rejection(response, 500, "XX000", "internal");
  const allowed =
    room &&
    chat.mode.send === "ok" &&
    canWrite(who, room) &&
    body.author_kind === "human" &&
    body.author_id === who.session.userId;
  if (!allowed) {
    return rejection(
      response,
      403,
      "42501",
      'new row violates row-level security policy for table "messages"',
    );
  }
  const stored = message(room.id, {
    author_id: who.session.userId,
    body: String(body.body ?? ""),
  });
  room.messages.push(stored);
  who.auth.calls.chat.push({ name: "message_sent", room: room.id, body: stored.body });
  const wantsObject = String(request.headers.accept ?? "").includes("vnd.pgrst.object");
  return send(response, 201, wantsObject ? stored : [stored]);
});

function rpc(name, handler) {
  route("POST", `/rest/v1/rpc/${name}`, async ({ request, response }) => {
    const who = caller(request);
    if (who.denied) return rejection(response, 401, "PGRST301", "JWT invalid");
    const args = JSON.parse((await readBody(request)) || "{}");
    who.auth.calls.chat.push({ name, args });
    const room = who.auth.chat.rooms.get(args.p_conversation_id);
    return handler({ who, args, room, response });
  });
}

function typed(response, message) {
  return send(response, 400, { code: "P0001", message, details: null, hint: null });
}

function system(room, event, body = "") {
  room.messages.push(message(room.id, { author_kind: "system", system_event: event, body }));
}

rpc("mark_read", ({ who, room, response }) => {
  if (!room || !canRead(who, room)) return rejection(response, 403, "42501");
  const row = room.members.find((entry) => entry.user_id === who.session.userId);
  if (row) row.last_read_at = new Date().toISOString();
  return sendEmpty(response);
});

rpc("set_conversation_ai", ({ who, args, room, response }) => {
  if (who.person.role !== "admin" || who.level !== "aal2")
    return rejection(response, 403, "42501", "admin_only");
  if (!room) return typed(response, "conversation_not_found");
  if (room.status !== "open") return typed(response, "conversation_archived");
  if (room.ai_enabled !== args.p_enabled) {
    room.ai_enabled = args.p_enabled;
    room.ai_off_reason = args.p_enabled ? null : "admin";
    system(room, args.p_enabled ? "ai_on" : "ai_off", args.p_enabled ? "" : "admin");
  }
  return sendEmpty(response);
});

rpc("set_ai_consent", ({ who, args, room, response }) => {
  const mine = room?.members.find(
    (entry) =>
      entry.user_id === who.session.userId && entry.role === "client" && entry.left_at === null,
  );
  if (!room || !mine) return rejection(response, 403, "42501");
  if (room.kind !== "client") return typed(response, "not_client_room");
  const granted = consentState(room) === "granted";
  if (granted !== args.p_granted) {
    if (args.p_granted) {
      room.consent_at = new Date().toISOString();
      room.consent_revoked_at = null;
      system(room, "consent_granted");
    } else {
      room.consent_revoked_at = new Date().toISOString();
      system(room, "consent_revoked");
    }
  }
  return sendEmpty(response);
});

rpc("archive_conversation", ({ who, room, response }) => {
  if (who.person.role !== "admin" || who.level !== "aal2")
    return rejection(response, 403, "42501", "admin_only");
  if (!room) return typed(response, "conversation_not_found");
  if (room.status === "open") {
    system(room, "archived");
    room.status = "archived";
  }
  return sendEmpty(response);
});

rpc("add_member", ({ who, args, room, response }) => {
  if (who.person.role !== "admin" || who.level !== "aal2")
    return rejection(response, 403, "42501", "admin_only");
  if (!room) return typed(response, "conversation_not_found");
  if (room.kind === "visitor") return typed(response, "visitor_room");
  if (!names[args.p_user_id]) return typed(response, "invalid_member");
  const existing = room.members.find((entry) => entry.user_id === args.p_user_id);
  if (existing && existing.left_at === null) return typed(response, "already_member");
  if (existing) existing.left_at = null;
  else
    room.members.push(member(args.p_user_id, args.p_role, { can_write: args.p_can_write ?? true }));
  system(room, "member_added", names[args.p_user_id]);
  return sendEmpty(response);
});

rpc("remove_member", ({ who, args, room, response }) => {
  if (who.person.role !== "admin" || who.level !== "aal2")
    return rejection(response, 403, "42501", "admin_only");
  const row = room?.members.find(
    (entry) => entry.user_id === args.p_user_id && entry.left_at === null,
  );
  if (!row) return typed(response, "member_not_found");
  if (row.role === "owner") return typed(response, "owner_cannot_leave");
  row.left_at = new Date().toISOString();
  system(room, "member_left", names[args.p_user_id]);
  return sendEmpty(response);
});

rpc("list_room_members", ({ who, room, response }) => {
  if (!room || !canRead(who, room)) return rejection(response, 403, "42501");
  const rows = room.members
    .filter((entry) => entry.left_at === null || who.person.role === "admin")
    .map((entry) => {
      const copy = { ...entry };
      delete copy.last_read_at;
      return copy;
    });
  return send(response, 200, rows);
});

route("GET", "/rest/v1/my_conversations", ({ request, response, url }) => {
  const who = caller(request);
  if (who.denied) return rejection(response, 401, "PGRST301", "JWT invalid");
  const { chat } = who.auth;
  who.auth.calls.chat.push({ name: "my_conversations", query: url.search });
  if (chat.mode.summaries === "error") return rejection(response, 500, "XX000", "internal");
  if (chat.mode.summaries === "empty") return send(response, 200, []);
  const wanted = /^eq\.(.+)$/.exec(url.searchParams.get("id") ?? "")?.[1];
  const kinds = /^in\.\((.*)\)$/.exec(url.searchParams.get("kind") ?? "")?.[1]?.split(",");
  const rows = [...chat.rooms.values()]
    .filter((room) => (wanted ? room.id === wanted : true))
    .filter((room) => (kinds ? kinds.includes(room.kind) : true))
    .filter((room) => canRead(who, room))
    .map((room) => summary(room, who.session.userId))
    .sort((a, b) => Date.parse(b.last_activity_at) - Date.parse(a.last_activity_at));
  return send(response, 200, rows);
});

route("GET", "/rest/v1/conversations", ({ request, response, url }) => {
  const who = caller(request);
  if (who.denied) return rejection(response, 401, "PGRST301", "JWT invalid");
  const { chat } = who.auth;
  const wanted = /^eq\.(.+)$/.exec(url.searchParams.get("id") ?? "")?.[1];
  const rows = [...chat.rooms.values()]
    .filter((room) => (wanted ? room.id === wanted : true))
    .filter((room) => canRead(who, room))
    .map((room) => ({
      id: room.id,
      kind: room.kind,
      status: room.status,
      ai_enabled: room.ai_enabled,
      ai_off_reason: room.ai_off_reason,
      lead_id: room.lead_id,
      contact_id: room.contact_id,
      first_page_path: room.first_page_path,
    }));
  return send(response, 200, rows);
});

route("POST", "/rest/v1/rpc/ensure_my_conversation", ({ request, response }) => {
  const who = caller(request);
  if (who.denied) return rejection(response, 401, "PGRST301", "JWT invalid");
  const { chat } = who.auth;
  who.auth.calls.chat.push({ name: "ensure_my_conversation" });
  const staff = who.person.role === "closer" || who.person.role === "freelance";
  if (!staff || who.level !== "aal2") return rejection(response, 403, "42501");
  let room = [...chat.rooms.values()].find(
    (entry) => entry.subject === who.session.userId && entry.kind === who.person.role,
  );
  if (!room) {
    const id = randomUUID();
    room = {
      id,
      kind: who.person.role,
      status: "open",
      ai_enabled: true,
      ai_off_reason: null,
      consent_at: null,
      consent_revoked_at: null,
      project_id: null,
      subject: who.session.userId,
      lead_id: null,
      contact_id: null,
      first_page_path: null,
      members: [...owners(), member(who.session.userId, who.person.role)],
      messages: [],
    };
    chat.rooms.set(id, room);
    allRooms.add(room);
  }
  return send(response, 200, JSON.stringify(room.id));
});

const serviceKey = "test-service-role-key";

function serviceOnly(request, response) {
  if (request.headers.authorization === `Bearer ${serviceKey}`) return true;
  rejection(response, 401, "PGRST301", "JWT invalid");
  return false;
}

const storageLog = [];
let storageMode = "ok";

route("POST", "/__chat/storage-mode", async ({ request, response }) => {
  storageMode = JSON.parse(await readBody(request)).mode;
  return send(response, 200, { ok: true });
});

route("GET", "/__chat/storage", ({ response }) => send(response, 200, storageLog));

route("POST", "/__chat/storage-reset", ({ response }) => {
  storageLog.length = 0;
  storageMode = "ok";
  return send(response, 200, { ok: true });
});

route(
  "POST",
  /^\/storage\/v1\/object\/chat-attachments\/(.+)$/,
  async ({ request, response, match }) => {
    if (!serviceOnly(request, response)) return undefined;
    const raw = await readBody(request);
    storageLog.push({ kind: "upload", path: decodeURIComponent(match[1]), size: raw.length });
    if (storageMode === "upload-error") return rejection(response, 500, "XX000", "storage");
    return send(response, 200, { Key: `chat-attachments/${match[1]}`, Id: randomUUID() });
  },
);

route("DELETE", /^\/storage\/v1\/object\/chat-attachments$/, async ({ request, response }) => {
  if (!serviceOnly(request, response)) return undefined;
  const body = JSON.parse(await readBody(request));
  storageLog.push({ kind: "remove", paths: body.prefixes });
  return send(response, 200, []);
});

route(
  "POST",
  /^\/storage\/v1\/object\/sign\/chat-attachments\/(.+)$/,
  async ({ request, response, match }) => {
    if (!serviceOnly(request, response)) return undefined;
    storageLog.push({ kind: "sign", path: decodeURIComponent(match[1]) });
    return send(response, 200, {
      signedURL: `/object/sign/chat-attachments/${match[1]}?token=mock-token`,
    });
  },
);

route("GET", /^\/storage\/v1\/object\/sign\/chat-attachments\/(.+)$/, ({ response }) =>
  send(response, 200, "%PDF-1.4\n%mock\n", "application/pdf"),
);

route("POST", "/rest/v1/rpc/register_attachment", async ({ request, response }) => {
  if (!serviceOnly(request, response)) return undefined;
  const args = JSON.parse(await readBody(request));
  const found = findMessage(args.p_message_id);
  if (!found) return typed(response, "message_not_found");
  const { room, entry } = found;
  if (room.kind === "visitor") return typed(response, "attachments_not_allowed");
  if (entry.author_id !== args.p_uploaded_by) return typed(response, "not_message_author");
  if (entry.message_attachments.length >= 5) return typed(response, "too_many_attachments");
  const id = String(args.p_path).split("/").at(-1);
  entry.message_attachments.push({
    id,
    name: args.p_name,
    mime: args.p_mime,
    size_bytes: args.p_size,
    storage_path: args.p_path,
  });
  storageLog.push({ kind: "register", name: args.p_name, mime: args.p_mime, size: args.p_size });
  return send(response, 200, JSON.stringify(id));
});

route("GET", "/rest/v1/message_attachments", ({ request, response, url }) => {
  const who = caller(request);
  if (who.denied) return rejection(response, 401, "PGRST301", "JWT invalid");
  const wanted = /^eq\.(.+)$/.exec(url.searchParams.get("id") ?? "")?.[1];
  const rows = [];
  for (const room of who.auth.chat.rooms.values()) {
    if (!canRead(who, room)) continue;
    for (const entry of room.messages) {
      for (const attachment of entry.message_attachments ?? []) {
        if (!wanted || attachment.id === wanted) rows.push(attachment);
      }
    }
  }
  return send(response, 200, rows);
});
