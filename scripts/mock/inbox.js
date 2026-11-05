import { randomUUID } from "node:crypto";

import { bearer, extendAuthState, personById, stateFor } from "./auth.js";
import { readBody, route, send } from "./registry.js";

const dailyLimit = 25;
const excerptLength = 140;

extendAuthState((state) => {
  state.inbox = { mode: "data", claim: null, claims: new Map() };
  state.calls.inbox = [];
});

route("POST", "/__auth/inbox-state", async ({ request, response, url }) => {
  const body = JSON.parse(await readBody(request));
  Object.assign(stateFor(url.searchParams.get("tag") ?? "").inbox, body);
  return send(response, 200, { ok: true });
});

route("POST", "/__auth/inbox-seed", async ({ request, response, url }) => {
  const auth = stateFor(url.searchParams.get("tag") ?? "");
  const rows = JSON.parse(await readBody(request));
  for (const row of rows) {
    auth.leads.unshift({
      via: "hiring",
      source: "form",
      email: null,
      organization: null,
      contact_id: null,
      assigned_to: null,
      discard_reason: null,
      offer: null,
      phone: null,
      message: null,
      locale: "es",
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
      status: "new",
      created_at: new Date().toISOString(),
      ...row,
      id: row.id ?? randomUUID(),
    });
  }
  return send(response, 200, { ok: true });
});

function fail(response, status, code, message) {
  return send(response, status, { code, message, details: null, hint: null });
}

function staff(request) {
  const session = bearer(request);
  if (!session) return { denied: (response) => fail(response, 401, "PGRST301", "JWT invalid") };
  const person = personById(session.userId)?.[1];
  const allowed =
    person && session.level === "aal2" && (person.role === "admin" || person.role === "closer");
  if (!allowed) return { denied: (response) => fail(response, 403, "42501", "forbidden") };
  return { session, person, auth: session.auth };
}

export function maskExcerpt(message) {
  return String(message ?? "")
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[…]")
    .replace(/(https?:\/\/|www\.)\S+/gi, "[…]")
    .replace(/\+?\d([\s.-]*\d){6,}/g, "[…]")
    .slice(0, excerptLength);
}

function inboxRows(auth) {
  return auth.leads
    .filter(
      (lead) => lead.status === "new" && lead.assigned_to === null && lead.contact_id === null,
    )
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .map((lead) => ({
      id: lead.id,
      first_name: String(lead.full_name).trim().split(" ")[0],
      via: lead.via,
      offer: lead.offer,
      extras: lead.extras,
      created_at: lead.created_at,
      excerpt: lead.message === null ? null : maskExcerpt(lead.message),
      locale: lead.locale,
    }));
}

route("POST", "/rest/v1/rpc/list_lead_inbox", ({ request, response }) => {
  const who = staff(request);
  if (who.denied) return who.denied(response);
  const { auth } = who;
  auth.calls.inbox.push({ name: "list_lead_inbox" });
  if (auth.inbox.mode === "error") return fail(response, 500, "XX000", "internal");
  if (auth.inbox.mode === "empty") return send(response, 200, []);
  return send(response, 200, inboxRows(auth));
});

route("POST", "/rest/v1/rpc/claim_lead", async ({ request, response }) => {
  const who = staff(request);
  if (who.denied) return who.denied(response);
  const { auth, person, session } = who;
  const args = JSON.parse(await readBody(request));
  auth.calls.inbox.push({ name: "claim_lead", args });
  const { inbox } = auth;
  if (inbox.claim === "error") return fail(response, 500, "XX000", "internal");
  const target = auth.leads.find((lead) => lead.id === args.p_lead_id);
  if (person.role !== "admin") {
    const used = (inbox.claims.get(session.userId) ?? 0) + 1;
    inbox.claims.set(session.userId, used);
    if (inbox.claim === "quota" || used > dailyLimit) {
      return fail(response, 400, "P0001", "claim_quota_exceeded");
    }
  }
  const open =
    target && target.status === "new" && target.assigned_to === null && target.contact_id === null;
  if (inbox.claim === "stale" || !open) {
    if (inbox.claim === "stale" && target) {
      target.assigned_to = "00000000-0000-4000-8000-0000000000c2";
      target.status = "converted";
    }
    return fail(response, 400, "P0001", "lead_already_claimed");
  }
  if (inbox.claim === "handoff") {
    target.assigned_to = "00000000-0000-4000-8000-0000000000a2";
    target.status = "assigned";
    return send(response, 200, "null");
  }
  const contactId = randomUUID();
  const dealId = randomUUID();
  const now = new Date().toISOString();
  auth.contacts.push({
    id: contactId,
    full_name: target.full_name,
    organization: target.organization,
    email: target.email,
    phone: target.phone,
    kind: "prospect",
    source: target.source === "manual" ? "manual" : target.source,
    owner_id: session.userId,
    lead_id: target.id,
    next_action: null,
    next_action_at: null,
    last_activity_at: null,
    created_at: now,
    deals: [
      {
        id: dealId,
        stage: "new",
        via: target.via ?? "hiring",
        amount: null,
        lost_reason: null,
        created_at: now,
        updated_at: now,
      },
    ],
  });
  target.assigned_to = session.userId;
  target.assigned_by = session.userId;
  target.assigned_at = now;
  target.status = "converted";
  target.contact_id = contactId;
  target.deal_id = dealId;
  return send(response, 200, JSON.stringify(contactId));
});
