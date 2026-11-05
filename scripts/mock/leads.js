import { bearer, extendAuthState, personById, stateFor } from "./auth.js";
import { readBody, route, send, sendEmpty } from "./registry.js";

const seededLeads = [
  {
    id: "10000000-0000-4000-8000-000000000003",
    via: "project",
    full_name: "Cara Pack",
    email: "cara@example.com",
    status: "new",
    created_at: "2026-11-03T09:30:00+00:00",
    assigned_to: null,
    discard_reason: null,
    offer: "web-negocio",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    via: "freelance",
    full_name: "Félix Freelance",
    email: "felix@example.com",
    status: "contacted",
    created_at: "2026-11-02T18:05:00+00:00",
    assigned_to: "00000000-0000-4000-8000-0000000000c1",
    discard_reason: null,
    offer: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000001",
    via: "hiring",
    full_name: "Hilda Hiring",
    email: "hilda@example.com",
    status: "assigned",
    created_at: "2026-11-01T08:00:00+00:00",
    assigned_to: "00000000-0000-4000-8000-0000000000c1",
    discard_reason: null,
    offer: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000000",
    via: null,
    full_name: "Nico Nexo",
    email: null,
    status: "discarded",
    created_at: "2026-10-30T12:00:00+00:00",
    assigned_to: null,
    discard_reason: "Duplicado",
    offer: null,
  },
];

extendAuthState((state) => {
  state.calls.leads = [];
  state.calls.rpc = [];
  state.leads = structuredClone(seededLeads);
  state.rpcError = null;
  state.leadsMode = "data";
});

route("POST", "/__auth/leads-mode", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").leadsMode = JSON.parse(await readBody(request)).mode;
  return send(response, 200, { ok: true });
});

route("POST", "/__auth/rpc-error", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").rpcError = JSON.parse(await readBody(request)).error;
  return send(response, 200, { ok: true });
});

route("GET", "/rest/v1/leads", ({ request, response }) => {
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
  return send(response, 200, auth.leads);
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
    const allowed = personById(session.userId)?.[1].role === "admin" && session.level === "aal2";
    if (!allowed) {
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
    const lead = auth.leads.find((entry) => entry.id === args.p_lead_id);
    if (!lead || lead.status === "discarded") {
      return send(response, 400, {
        code: "P0001",
        message: "lead_discarded",
        details: null,
        hint: null,
      });
    }
    if (match[1] === "assign_lead") {
      lead.assigned_to = args.p_user_id;
      lead.status = "converted";
      return send(response, 200, JSON.stringify("00000000-0000-4000-8000-0000000000f1"));
    }
    lead.status = "discarded";
    lead.discard_reason = args.p_reason;
    return sendEmpty(response);
  },
);
