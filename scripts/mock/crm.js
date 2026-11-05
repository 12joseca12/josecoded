import { randomUUID } from "node:crypto";

import { bearer, extendAuthState, people, personById, stateFor } from "./auth.js";
import { readBody, route, send, sendEmpty } from "./registry.js";

const cleo = "00000000-0000-4000-8000-0000000000c1";
const dani = "00000000-0000-4000-8000-0000000000c2";

const seededContacts = [
  {
    id: "20000000-0000-4000-8000-0000000000a1",
    full_name: "Ada Arquitecta",
    role_title: "Socia",
    city: "Valencia",
    tags: ["arquitectura"],
    notes: "Prefiere que la llamen por la tarde.",
    organization: "Estudio Ada",
    email: "ada@estudioada.example",
    phone: "600 111 222",
    kind: "prospect",
    source: "form",
    owner_id: cleo,
    next_action: "Enviar presupuesto",
    next_action_at: "2026-11-01T09:00:00+00:00",
    last_activity_at: "2026-11-03T12:00:00+00:00",
    created_at: "2026-10-20T08:00:00+00:00",
    deals: [
      {
        id: "30000000-0000-4000-8000-0000000000a1",
        stage: "proposal",
        via: "project",
        amount: 2400,
        lost_reason: null,
        created_at: "2026-10-21T08:00:00+00:00",
        updated_at: "2026-11-03T10:00:00.123456+00:00",
      },
    ],
  },
  {
    id: "20000000-0000-4000-8000-0000000000a2",
    full_name: "Bruno Banco",
    organization: "Banco SL",
    email: "bruno@banco.example",
    phone: null,
    kind: "client",
    source: "manual",
    owner_id: cleo,
    next_action: null,
    next_action_at: null,
    last_activity_at: "2026-10-20T12:00:00+00:00",
    created_at: "2026-09-01T08:00:00+00:00",
    deals: [
      {
        id: "30000000-0000-4000-8000-0000000000a2",
        stage: "won",
        via: "project",
        amount: 3000,
        won_amount: 2800,
        won_at: "2026-10-20T10:00:00+00:00",
        recurring_monthly: 60,
        recurring_started_at: "2026-10-25",
        recurring_cancelled_at: null,
        lost_reason: null,
        created_at: "2026-09-02T08:00:00+00:00",
        updated_at: "2026-10-20T10:00:00+00:00",
      },
    ],
  },
  {
    id: "20000000-0000-4000-8000-0000000000a3",
    full_name: "Eva Evento",
    organization: null,
    email: null,
    phone: null,
    kind: "partner",
    source: "manual",
    owner_id: cleo,
    next_action: "Llamar tras el evento",
    next_action_at: "2099-01-01T09:00:00+00:00",
    last_activity_at: null,
    created_at: "2026-10-25T08:00:00+00:00",
    deals: [],
  },
  {
    id: "20000000-0000-4000-8000-0000000000b1",
    full_name: "Carmen Cuenta",
    organization: "Cuenta SA",
    email: "carmen@cuenta.example",
    phone: "+44 20 7946 0958",
    kind: "prospect",
    source: "whatsapp",
    owner_id: dani,
    next_action: null,
    next_action_at: null,
    last_activity_at: "2026-11-04T12:00:00+00:00",
    created_at: "2026-10-30T08:00:00+00:00",
    deals: [
      {
        id: "30000000-0000-4000-8000-0000000000b1",
        stage: "new",
        via: "freelance",
        amount: 800,
        lost_reason: null,
        created_at: "2026-10-30T09:00:00+00:00",
        updated_at: "2026-11-04T10:00:00+00:00",
      },
    ],
  },
  {
    id: "20000000-0000-4000-8000-0000000000c1",
    full_name: "Dario Directo",
    organization: null,
    email: "dario@directo.example",
    phone: null,
    kind: "other",
    source: "radar",
    owner_id: null,
    next_action: null,
    next_action_at: null,
    last_activity_at: null,
    created_at: "2026-10-10T08:00:00+00:00",
    deals: [],
  },
];

const adminEnrolled = "00000000-0000-4000-8000-0000000000a2";

const seededActivities = [
  {
    id: "40000000-0000-4000-8000-0000000000a1",
    contact_id: "20000000-0000-4000-8000-0000000000a1",
    deal_id: "30000000-0000-4000-8000-0000000000a1",
    author_id: cleo,
    kind: "call",
    body: "Primera llamada: quiere web y catálogo.",
    occurred_at: "2026-11-03T12:00:00+00:00",
  },
  {
    id: "40000000-0000-4000-8000-0000000000a2",
    contact_id: "20000000-0000-4000-8000-0000000000a1",
    deal_id: null,
    author_id: adminEnrolled,
    kind: "note",
    body: "Nota del administrador.",
    occurred_at: "2026-11-02T09:00:00+00:00",
  },
  {
    id: "40000000-0000-4000-8000-0000000000a3",
    contact_id: "20000000-0000-4000-8000-0000000000a1",
    deal_id: null,
    author_id: null,
    kind: "form",
    body: null,
    occurred_at: "2026-10-21T08:00:00+00:00",
  },
];

extendAuthState((state) => {
  state.contacts = structuredClone(seededContacts);
  state.crmMode = "data";
  state.crmWriteError = null;
  state.calls.crm = [];
  state.activities = structuredClone(seededActivities);
});

route("POST", "/__auth/crm-mode", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").crmMode = JSON.parse(await readBody(request)).mode;
  return send(response, 200, { ok: true });
});

route("POST", "/__auth/crm-write-error", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").crmWriteError = JSON.parse(
    await readBody(request),
  ).error;
  return send(response, 200, { ok: true });
});

export function callerOf(request) {
  const session = bearer(request);
  if (!session) return null;
  const person = personById(session.userId)?.[1] ?? null;
  return { session, auth: session.auth, person };
}

export function canSee(caller, contact) {
  if (!caller.person || caller.session.level !== "aal2") return false;
  if (caller.person.role === "admin") return true;
  if (caller.person.role !== "closer" || contact.owner_id === null) return false;
  const owner = Object.values(people).find((entry) => entry.id === contact.owner_id);
  return contact.owner_id === caller.person.id || owner?.parent === caller.person.id;
}

export function fail(response, status, code, message) {
  return send(response, status, { code, message, details: null, hint: null });
}

export function operand(value) {
  const index = value.indexOf(".");
  return [value.slice(0, index), value.slice(index + 1)];
}

function matchesSearch(contact, expression) {
  const inner = expression.replace(/^\(/, "").replace(/\)$/, "");
  return inner.split(",").some((part) => {
    const field = part.slice(0, part.indexOf("."));
    const pattern = part.slice(part.indexOf(".", field.length + 1) + 1);
    const needle = pattern.replaceAll("*", "").toLowerCase();
    return String(contact[field] ?? "")
      .toLowerCase()
      .includes(needle);
  });
}

function filterContacts(contacts, url) {
  const params = url.searchParams;
  const inner = (params.get("select") ?? "").includes("deals!inner");
  const stage = params.get("deals.stage");
  const next = params.getAll("next_action_at");
  let rows = contacts.map((contact) => ({
    ...contact,
    deals: stage ? contact.deals.filter((deal) => deal.stage === operand(stage)[1]) : contact.deals,
  }));
  if (inner) rows = rows.filter((contact) => contact.deals.length > 0);
  const byId = params.get("id");
  if (byId) rows = rows.filter((contact) => contact.id === operand(byId)[1]);
  const kind = params.get("kind");
  if (kind) rows = rows.filter((contact) => contact.kind === operand(kind)[1]);
  const owner = params.get("owner_id");
  if (owner === "is.null") rows = rows.filter((contact) => contact.owner_id === null);
  else if (owner) rows = rows.filter((contact) => contact.owner_id === operand(owner)[1]);
  for (const condition of next) {
    if (condition === "not.is.null") rows = rows.filter((contact) => contact.next_action_at);
    if (condition.startsWith("lte.")) {
      const limit = Date.parse(condition.slice(4));
      rows = rows.filter((contact) => Date.parse(contact.next_action_at) <= limit);
    }
    if (condition.startsWith("gt.")) {
      const limit = Date.parse(condition.slice(3));
      rows = rows.filter((contact) => Date.parse(contact.next_action_at) > limit);
    }
  }
  for (const column of ["lead_id", "import_id", "archived_at"]) {
    if (params.get(column) === "is.null") rows = rows.filter((contact) => !contact[column]);
  }
  const search = params.get("or");
  if (search) rows = rows.filter((contact) => matchesSearch(contact, search));
  rows.sort((a, b) => {
    const left = a.last_activity_at ? Date.parse(a.last_activity_at) : -Infinity;
    const right = b.last_activity_at ? Date.parse(b.last_activity_at) : -Infinity;
    return right - left || Date.parse(b.created_at) - Date.parse(a.created_at);
  });
  if ((params.get("order") ?? "").startsWith("next_action_at.asc")) {
    rows.sort((a, b) => Date.parse(a.next_action_at) - Date.parse(b.next_action_at));
  }
  return rows.slice(0, Number(params.get("limit") ?? 1000));
}

function present(contact) {
  return {
    role_title: null,
    city: null,
    website: null,
    linkedin_url: null,
    tags: [],
    notes: null,
    ...contact,
    deals: contact.deals.map((deal) => ({
      won_amount: null,
      won_at: null,
      lost_reason: null,
      lost_at: null,
      ...deal,
    })),
  };
}

route("GET", "/rest/v1/contacts", ({ request, response, url }) => {
  const caller = callerOf(request);
  if (!caller) return fail(response, 401, "PGRST301", "JWT invalid");
  const { auth } = caller;
  auth.calls.crm.push({ kind: "list-contacts", query: url.search });
  if (auth.crmMode === "error") return fail(response, 500, "XX000", "internal");
  if (auth.crmMode === "empty") return send(response, 200, []);
  const visible = auth.contacts.filter((contact) => canSee(caller, contact));
  return send(response, 200, filterContacts(visible, url).map(present));
});

route("POST", "/rest/v1/contacts", async ({ request, response }) => {
  const caller = callerOf(request);
  if (!caller) return fail(response, 401, "PGRST301", "JWT invalid");
  const { auth, person, session } = caller;
  const body = JSON.parse(await readBody(request));
  auth.calls.crm.push({ kind: "insert-contact", body, level: session.level });
  const allowed =
    person && session.level === "aal2" && (person.role === "admin" || person.role === "closer");
  if (!allowed || (person.role === "closer" && body.owner_id !== person.id)) {
    return fail(response, 403, "42501", "new row violates row-level security policy");
  }
  if (auth.crmWriteError)
    return send(response, 400, { details: null, hint: null, ...auth.crmWriteError });
  const taken = auth.contacts.some(
    (contact) => body.email && contact.owner_id === body.owner_id && contact.email === body.email,
  );
  if (taken) return fail(response, 409, "23505", "duplicate key value violates unique constraint");
  const contact = {
    id: randomUUID(),
    full_name: body.full_name,
    organization: body.organization ?? null,
    email: body.email ?? null,
    phone: body.phone ?? null,
    kind: body.kind ?? "prospect",
    source: "manual",
    owner_id: body.owner_id,
    next_action: null,
    next_action_at: null,
    last_activity_at: null,
    created_at: new Date().toISOString(),
    deals: [],
  };
  auth.contacts.push(contact);
  return send(response, 201, { id: contact.id });
});

route("GET", "/rest/v1/deals", ({ request, response, url }) => {
  const caller = callerOf(request);
  if (!caller) return fail(response, 401, "PGRST301", "JWT invalid");
  if ((url.searchParams.get("select") ?? "").includes("contacts(")) {
    const rows = caller.auth.contacts
      .filter((contact) => canSee(caller, contact))
      .flatMap((contact) =>
        contact.deals
          .filter((deal) => deal.stage === "won")
          .map((deal) => ({
            id: deal.id,
            won_amount: deal.won_amount ?? null,
            recurring_monthly: deal.recurring_monthly ?? null,
            contacts: { full_name: contact.full_name },
          })),
      );
    return send(response, 200, rows);
  }
  const id = operand(url.searchParams.get("id") ?? "eq.")[1];
  const rows = caller.auth.contacts
    .filter((contact) => canSee(caller, contact))
    .flatMap((contact) => contact.deals)
    .filter((deal) => !id || deal.id === id)
    .map((deal) => ({ id: deal.id, stage: deal.stage }));
  return send(response, 200, rows);
});

route("PATCH", "/rest/v1/deals", async ({ request, response, url }) => {
  const caller = callerOf(request);
  if (!caller) return fail(response, 401, "PGRST301", "JWT invalid");
  const { auth } = caller;
  const body = JSON.parse(await readBody(request));
  if ("owner_id" in body) {
    auth.calls.crm.push({ kind: "patch-deals-owner", query: url.search, body });
    return sendEmpty(response);
  }
  const id = operand(url.searchParams.get("id") ?? "eq.")[1];
  const stamp = operand(url.searchParams.get("updated_at") ?? "eq.")[1];
  auth.calls.crm.push({ kind: "patch-deal", id, stamp, body });
  if (auth.crmWriteError)
    return send(response, 400, { details: null, hint: null, ...auth.crmWriteError });
  const contact = auth.contacts.find(
    (entry) => canSee(caller, entry) && entry.deals.some((deal) => deal.id === id),
  );
  const deal = contact?.deals.find((entry) => entry.id === id);
  if (!deal || deal.updated_at !== stamp) return send(response, 200, []);
  if (body.stage === "won") {
    return fail(response, 403, "42501", "won_requires_win_deal");
  }
  deal.stage = body.stage;
  deal.lost_reason = body.lost_reason ?? null;
  deal.lost_at = body.stage === "lost" ? new Date().toISOString() : null;
  deal.updated_at = new Date().toISOString();
  return send(response, 200, [{ id }]);
});

route("GET", "/rest/v1/activities", ({ request, response, url }) => {
  const caller = callerOf(request);
  if (!caller) return fail(response, 401, "PGRST301", "JWT invalid");
  const { auth } = caller;
  if (auth.crmMode === "error") return fail(response, 500, "XX000", "internal");
  const contactId = operand(url.searchParams.get("contact_id") ?? "eq.")[1];
  const contact = auth.contacts.find((entry) => entry.id === contactId);
  if (!contact || !canSee(caller, contact)) return send(response, 200, []);
  const rows = auth.activities
    .filter((activity) => activity.contact_id === contactId)
    .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))
    .map(({ id, kind, body, occurred_at, author_id, deal_id }) => ({
      id,
      kind,
      body,
      occurred_at,
      author_id,
      deal_id,
    }));
  return send(response, 200, rows);
});

route("POST", "/rest/v1/activities", async ({ request, response }) => {
  const caller = callerOf(request);
  if (!caller) return fail(response, 401, "PGRST301", "JWT invalid");
  const { auth, person } = caller;
  const body = JSON.parse(await readBody(request));
  auth.calls.crm.push({ kind: "insert-activity", body });
  const contact = auth.contacts.find((entry) => entry.id === body.contact_id);
  if (!contact || !canSee(caller, contact) || body.author_id !== person?.id) {
    return fail(response, 403, "42501", "new row violates row-level security policy");
  }
  if (auth.crmWriteError)
    return send(response, 400, { details: null, hint: null, ...auth.crmWriteError });
  if (body.deal_id && !contact.deals.some((deal) => deal.id === body.deal_id)) {
    return fail(response, 409, "23503", "foreign key violation");
  }
  auth.activities.push({ id: randomUUID(), occurred_at: new Date().toISOString(), ...body });
  contact.last_activity_at = new Date().toISOString();
  return sendEmpty(response);
});

route("PATCH", "/rest/v1/contacts", async ({ request, response, url }) => {
  const caller = callerOf(request);
  if (!caller) return fail(response, 401, "PGRST301", "JWT invalid");
  const { auth, person, session } = caller;
  const body = JSON.parse(await readBody(request));
  const id = operand(url.searchParams.get("id") ?? "eq.")[1];
  auth.calls.crm.push({ kind: "patch-contact", id, body });
  const contact = auth.contacts.find((entry) => entry.id === id);
  if (!contact || !canSee(caller, contact)) return send(response, 200, []);
  if ("owner_id" in body && !(person?.role === "admin" && session.level === "aal2")) {
    return fail(response, 403, "42501", "owner_change_admin_only");
  }
  if (auth.crmWriteError)
    return send(response, 400, { details: null, hint: null, ...auth.crmWriteError });
  contact.owner_id = body.owner_id;
  for (const deal of contact.deals) {
    if (["new", "contacted", "meeting", "proposal"].includes(deal.stage))
      deal.owner_id = body.owner_id;
  }
  return send(response, 200, [{ id }]);
});
