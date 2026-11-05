import { randomUUID } from "node:crypto";

import { bearer, extendAuthState, personById, stateFor } from "./auth.js";
import { readBody, route, send, sendEmpty } from "./registry.js";

const closerId = "00000000-0000-4000-8000-0000000000c1";
const adminId = "00000000-0000-4000-8000-0000000000a2";
const dealId = "20000000-0000-4000-8000-000000000001";
const contactId = "30000000-0000-4000-8000-000000000001";

function lead(base) {
  return {
    via: null,
    source: "form",
    email: null,
    organization: null,
    contact_id: null,
    assigned_to: null,
    discard_reason: null,
    offer: null,
    phone: null,
    message: null,
    locale: null,
    page_path: null,
    consent_at: null,
    assigned_at: null,
    assigned_by: null,
    deal_id: null,
    company: null,
    offer_url: null,
    wanted_by: null,
    has_domain: null,
    has_store_accounts: null,
    extras: [],
    offer_answers: null,
    ...base,
  };
}

const seededLeads = [
  lead({
    id: "10000000-0000-4000-8000-000000000003",
    via: "project",
    full_name: "Cara Pack",
    email: "cara@example.com",
    organization: "Cara SL",
    phone: "+34 600 000 003",
    status: "new",
    created_at: "2026-11-03T09:30:00+00:00",
    offer: "web-negocio",
    extras: ["accounts", "payments"],
    offer_answers: {
      start: "idea",
      kind: "web",
      size: "medium",
      accounts: "basic",
      management: "me",
      more: ["payments"],
    },
    message: "Quiero una web con área de clientes.\nGracias.",
    locale: "es",
    page_path: "/es/contacto",
    consent_at: "2026-11-03T09:30:00+00:00",
  }),
  lead({
    id: "10000000-0000-4000-8000-000000000002",
    via: "freelance",
    full_name: "Félix Freelance",
    email: "felix@example.com",
    status: "contacted",
    created_at: "2026-11-02T18:05:00+00:00",
    assigned_to: closerId,
    assigned_by: adminId,
    assigned_at: "2026-11-02T18:30:00+00:00",
    wanted_by: "2026-12-01",
    message: "Busco a alguien para un proyecto de tres meses.",
    locale: "es",
    consent_at: "2026-11-02T18:05:00+00:00",
  }),
  lead({
    id: "10000000-0000-4000-8000-000000000001",
    via: "hiring",
    source: "manual",
    full_name: "Hilda Hiring",
    email: "hilda@example.com",
    status: "assigned",
    created_at: "2026-11-01T08:00:00+00:00",
    assigned_to: closerId,
    assigned_at: "2026-11-01T08:00:00+00:00",
    contact_id: contactId,
    deal_id: dealId,
    company: "Acme",
    offer_url: "https://example.com/oferta",
  }),
  lead({
    id: "10000000-0000-4000-8000-000000000000",
    full_name: "Nico Nexo",
    source: "nexo",
    status: "discarded",
    created_at: "2026-10-30T12:00:00+00:00",
    discard_reason: "Duplicado",
  }),
  lead({
    id: "10000000-0000-4000-8000-0000000000ff",
    via: "hiring",
    full_name: "Wanda Waiting",
    email: "wanda@example.com",
    status: "new",
    created_at: "2026-10-29T10:00:00+00:00",
    contact_id: "30000000-0000-4000-8000-000000000002",
  }),
];

extendAuthState((state) => {
  state.calls.leads = [];
  state.calls.rpc = [];
  state.calls.leadInserts = [];
  state.leads = structuredClone(seededLeads);
  state.rpcError = null;
  state.leadsMode = "data";
  state.leadInsertError = null;
});

route("POST", "/__auth/leads-mode", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").leadsMode = JSON.parse(await readBody(request)).mode;
  return send(response, 200, { ok: true });
});

route("POST", "/__auth/rpc-error", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").rpcError = JSON.parse(await readBody(request)).error;
  return send(response, 200, { ok: true });
});

route("POST", "/__auth/lead-insert-error", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").leadInsertError = JSON.parse(
    await readBody(request),
  ).error;
  return send(response, 200, { ok: true });
});

function isAdmin(session) {
  return personById(session.userId)?.[1].role === "admin" && session.level === "aal2";
}

function wantsObject(request) {
  return (request.headers.accept ?? "").includes("vnd.pgrst.object");
}

route("GET", "/rest/v1/leads", ({ request, response, url }) => {
  const session = bearer(request);
  if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
  const auth = session.auth;
  auth.calls.leads.push({ authenticated: true, level: session.level });
  if (auth.leadsMode === "error") {
    return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
  }
  if (!isAdmin(session) || auth.leadsMode === "empty") return send(response, 200, []);
  const id = (url.searchParams.get("id") ?? "").replace("eq.", "");
  if (id === "") return send(response, 200, auth.leads);
  const found = auth.leads.filter((entry) => entry.id === id);
  if (wantsObject(request)) {
    if (found.length === 0) {
      return send(response, 406, {
        code: "PGRST116",
        message: "no rows",
        details: "0 rows",
        hint: null,
      });
    }
    return send(response, 200, found[0]);
  }
  return send(response, 200, found);
});

route("POST", "/rest/v1/leads", async ({ request, response }) => {
  const session = bearer(request);
  if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
  const auth = session.auth;
  const body = JSON.parse(await readBody(request));
  auth.calls.leadInserts.push({ body, level: session.level });
  if (!isAdmin(session)) {
    return send(response, 403, {
      code: "42501",
      message: "new row violates row-level security policy",
      details: null,
      hint: null,
    });
  }
  if (auth.leadInsertError) {
    return send(response, 400, { details: null, hint: null, ...auth.leadInsertError });
  }
  if (!body.email && !body.phone) {
    return send(response, 400, {
      code: "23514",
      message: 'new row for relation "leads" violates check constraint "leads_reachable"',
      details: null,
      hint: null,
    });
  }
  const assignee = body.assigned_to ? personById(body.assigned_to)?.[1] : null;
  if (body.assigned_to && assignee?.role !== "closer") {
    return send(response, 400, {
      code: "P0001",
      message: "invalid_assignee",
      details: null,
      hint: null,
    });
  }
  const row = lead({
    ...body,
    id: randomUUID(),
    status: body.assigned_to ? "assigned" : "new",
    created_at: new Date().toISOString(),
    assigned_at: body.assigned_to ? new Date().toISOString() : null,
    assigned_by: body.assigned_to ? session.userId : null,
  });
  auth.leads.unshift(row);
  const created = { id: row.id };
  return send(response, 201, wantsObject(request) ? created : [created]);
});

route("GET", "/rest/v1/deals", ({ request, response }) => {
  const session = bearer(request);
  if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
  return send(response, 200, isAdmin(session) ? [{ stage: "contacted" }] : []);
});

route(
  "POST",
  /^\/rest\/v1\/rpc\/(assign_lead|discard_lead)$/,
  async ({ request, response, match }) => {
    const session = bearer(request);
    if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
    const auth = session.auth;
    const args = JSON.parse(await readBody(request));
    auth.calls.rpc.push({ name: match[1], args, level: session.level });
    if (!isAdmin(session)) {
      return send(response, 403, {
        code: "42501",
        message: "admin_only",
        details: null,
        hint: null,
      });
    }
    if (auth.rpcError) {
      return send(response, 400, { details: null, hint: null, ...auth.rpcError });
    }
    const target = auth.leads.find((entry) => entry.id === args.p_lead_id);
    if (!target || target.status === "discarded") {
      return send(response, 400, {
        code: "P0001",
        message: "lead_discarded",
        details: null,
        hint: null,
      });
    }
    if (match[1] === "assign_lead") {
      target.assigned_to = args.p_user_id;
      target.assigned_by = session.userId;
      target.assigned_at = new Date().toISOString();
      target.status = "converted";
      return send(response, 200, JSON.stringify("00000000-0000-4000-8000-0000000000f1"));
    }
    target.status = "discarded";
    target.discard_reason = args.p_reason;
    return sendEmpty(response);
  },
);
