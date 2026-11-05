import { randomUUID } from "node:crypto";

import { extendAuthState, people, stateFor } from "./auth.js";
import { callerOf, canSee, fail } from "./crm.js";
import { readBody, route, send, sendEmpty } from "./registry.js";

const cleo = "00000000-0000-4000-8000-0000000000c1";
const brunoDeal = "30000000-0000-4000-8000-0000000000a2";

const seeded = {
  commissions: [
    {
      id: "60000000-0000-4000-8000-000000000001",
      deal_id: brunoDeal,
      closer_id: cleo,
      closer_rate: 10,
      closer_recurring_rate: 5,
      subcloser_id: null,
      subcloser_rate: null,
      subcloser_recurring_rate: null,
      expected_base: 2800,
      expected_closer_amount: 280,
      expected_subcloser_amount: 0,
    },
  ],
  lines: [
    {
      id: "61000000-0000-4000-8000-000000000001",
      commission_id: "60000000-0000-4000-8000-000000000001",
      payment_id: "72000000-0000-4000-8000-000000000001",
      payout_id: null,
      beneficiary_id: cleo,
      role: "closer",
      nature: "project",
      rate: 10,
      base: 1400,
      amount: 140,
      status: "accrued",
      rejected_reason: null,
      created_at: "2026-10-20T12:00:00+00:00",
    },
  ],
  schedule: [
    {
      id: "70000000-0000-4000-8000-000000000001",
      deal_id: brunoDeal,
      label: "Anticipo 50 %",
      kind: "milestone",
      percent: 50,
      amount: 1400,
      due_at: "2026-10-20",
      status: "paid",
      sort: 1,
    },
    {
      id: "70000000-0000-4000-8000-000000000002",
      deal_id: brunoDeal,
      label: "Entrega final 50 %",
      kind: "milestone",
      percent: 50,
      amount: 1400,
      due_at: "2026-10-30",
      status: "proforma_sent",
      sort: 2,
    },
  ],
  invoices: [
    {
      id: "71000000-0000-4000-8000-000000000001",
      deal_id: brunoDeal,
      schedule_id: "70000000-0000-4000-8000-000000000002",
      kind: "proforma",
      number: "PF-2026-001",
      issued_at: "2026-10-25",
      amount_net: 1400,
      vat_rate: 0,
      vat_amount: 0,
      amount_gross: 1400,
      pdf_path: null,
      status: "sent",
    },
  ],
  payments: [
    {
      id: "72000000-0000-4000-8000-000000000001",
      deal_id: brunoDeal,
      schedule_id: "70000000-0000-4000-8000-000000000001",
      invoice_id: null,
      kind: "payment",
      nature: "project",
      amount_net: 1400,
      received_at: "2026-10-20",
      method: "transfer",
      reference: "Prueba: transferencia anticipo",
    },
  ],
};

extendAuthState((state) => {
  state.money = structuredClone(seeded);
  state.moneyMode = "data";
  state.calls.money = [];
});

route("POST", "/__auth/money-mode", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").moneyMode = JSON.parse(await readBody(request)).mode;
  return send(response, 200, { ok: true });
});

function inValues(url, field) {
  const raw = url.searchParams.get(field) ?? "";
  const match = /^in\.\((.*)\)$/.exec(raw);
  return match ? match[1].split(",").filter(Boolean) : null;
}

function isAdmin(caller) {
  return caller.person?.role === "admin" && caller.session.level === "aal2";
}

function findDeal(auth, dealId) {
  for (const contact of auth.contacts) {
    const deal = contact.deals.find((entry) => entry.id === dealId);
    if (deal) return { contact, deal };
  }
  return null;
}

function dealVisible(caller, dealId) {
  const found = findDeal(caller.auth, dealId);
  return found !== null && canSee(caller, found.contact);
}

function headerVisible(caller, header) {
  if (isAdmin(caller)) return true;
  if (!caller.person || caller.session.level !== "aal2") return false;
  return header.closer_id === caller.person.id || header.subcloser_id === caller.person.id;
}

function lineVisible(caller, line) {
  if (isAdmin(caller)) return true;
  if (!caller.person || caller.session.level !== "aal2") return false;
  if (line.beneficiary_id === caller.person.id) return true;
  const beneficiary = Object.values(people).find((entry) => entry.id === line.beneficiary_id);
  return beneficiary?.parent === caller.person.id;
}

function guard(request, response, kind, url) {
  const caller = callerOf(request);
  if (!caller) {
    fail(response, 401, "PGRST301", "JWT invalid");
    return null;
  }
  caller.auth.calls.money.push({ kind, query: url?.search ?? "" });
  if (caller.auth.moneyMode === "error") {
    fail(response, 500, "XX000", "internal");
    return null;
  }
  if (caller.auth.moneyMode === "empty") {
    send(response, 200, []);
    return null;
  }
  return caller;
}

route("GET", "/rest/v1/commissions", ({ request, response, url }) => {
  const caller = guard(request, response, "list-commissions", url);
  if (!caller) return undefined;
  const ids = inValues(url, "deal_id");
  const rows = caller.auth.money.commissions
    .filter((header) => (ids === null ? true : ids.includes(header.deal_id)))
    .filter((header) => headerVisible(caller, header));
  return send(response, 200, rows);
});

route("GET", "/rest/v1/commission_lines", ({ request, response, url }) => {
  const caller = guard(request, response, "list-lines", url);
  if (!caller) return undefined;
  const ids = inValues(url, "commission_id");
  const rows = caller.auth.money.lines
    .filter((line) => (ids === null ? true : ids.includes(line.commission_id)))
    .filter((line) => lineVisible(caller, line))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return send(response, 200, rows);
});

route("GET", "/rest/v1/payment_schedule", ({ request, response, url }) => {
  const caller = guard(request, response, "list-schedule", url);
  if (!caller) return undefined;
  const ids = inValues(url, "deal_id");
  const rows = caller.auth.money.schedule
    .filter((item) => (ids === null ? true : ids.includes(item.deal_id)))
    .filter((item) => isAdmin(caller) || dealVisible(caller, item.deal_id))
    .sort((a, b) => a.sort - b.sort);
  return send(response, 200, rows);
});

route("GET", "/rest/v1/invoices", ({ request, response, url }) => {
  const caller = guard(request, response, "list-invoices", url);
  if (!caller) return undefined;
  if (!isAdmin(caller)) return send(response, 200, []);
  const ids = inValues(url, "deal_id");
  const rows = caller.auth.money.invoices
    .filter((invoice) => (ids === null ? true : ids.includes(invoice.deal_id)))
    .sort((a, b) => b.issued_at.localeCompare(a.issued_at));
  return send(response, 200, rows);
});

route("POST", "/rest/v1/rpc/deal_payments", async ({ request, response }) => {
  const caller = guard(request, response, "deal-payments", undefined);
  if (!caller) return undefined;
  const body = JSON.parse(await readBody(request));
  if (!caller.person || caller.session.level !== "aal2") {
    return fail(response, 403, "42501", "forbidden");
  }
  if (!isAdmin(caller) && !dealVisible(caller, body.p_deal_id)) {
    return fail(response, 400, "P0001", "deal_not_found");
  }
  const admin = isAdmin(caller);
  const rows = caller.auth.money.payments
    .filter((payment) => payment.deal_id === body.p_deal_id)
    .sort((a, b) => b.received_at.localeCompare(a.received_at))
    .map((payment) => ({
      id: payment.id,
      schedule_id: payment.schedule_id,
      kind: payment.kind,
      nature: payment.nature,
      amount_net: payment.amount_net,
      received_at: payment.received_at,
      method: admin ? payment.method : null,
      reference: admin ? payment.reference : null,
    }));
  return send(response, 200, rows);
});

function ratesFor(ownerId) {
  const owner = Object.values(people).find((entry) => entry.id === ownerId);
  if (!owner || owner.role !== "closer") return null;
  const rates = owner.rates ?? {};
  if (!owner.parent) {
    return {
      closer_id: owner.id,
      closer_rate: rates.closer ?? 0,
      closer_recurring_rate: rates.closerRecurring ?? null,
      subcloser_id: null,
      subcloser_rate: null,
      subcloser_recurring_rate: null,
    };
  }
  return {
    closer_id: owner.parent,
    closer_rate: rates.parent ?? 0,
    closer_recurring_rate: rates.parentRecurring ?? null,
    subcloser_id: owner.id,
    subcloser_rate: rates.closer ?? 0,
    subcloser_recurring_rate: rates.closerRecurring ?? null,
  };
}

function cents(value) {
  return Math.round(value * 100);
}

function share(amount, rate) {
  return Math.round((cents(amount) * Math.round(rate * 100)) / 10000) / 100;
}

route("POST", "/rest/v1/rpc/win_deal", async ({ request, response }) => {
  const caller = callerOf(request);
  if (!caller) return fail(response, 401, "PGRST301", "JWT invalid");
  const { auth, person, session } = caller;
  const body = JSON.parse(await readBody(request));
  auth.calls.money.push({ kind: "win-deal", body });
  if (!person || session.level !== "aal2" || !["admin", "closer"].includes(person.role)) {
    return fail(response, 403, "42501", "forbidden");
  }
  const found = findDeal(auth, body.p_deal_id);
  if (!found || !canSee(caller, found.contact)) {
    return fail(response, 400, "P0001", "deal_not_found");
  }
  const { contact, deal } = found;
  if (deal.stage === "won") return fail(response, 400, "P0001", "deal_already_won");
  if (deal.stage === "lost") return fail(response, 400, "P0001", "deal_lost");
  const won = body.p_won_amount;
  if (typeof won !== "number" || won <= 0) return fail(response, 400, "P0001", "invalid_amount");
  const monthly = body.p_recurring_monthly ?? null;
  if (monthly !== null && (typeof monthly !== "number" || monthly <= 0)) {
    return fail(response, 400, "P0001", "invalid_recurring");
  }
  deal.stage = "won";
  deal.won_amount = won;
  deal.won_at = new Date().toISOString();
  deal.recurring_monthly = monthly;
  deal.recurring_started_at = null;
  deal.recurring_cancelled_at = null;
  deal.updated_at = new Date().toISOString();
  const rates = deal.via === "hiring" ? null : ratesFor(contact.owner_id);
  if (!rates) return send(response, 200, null);
  const id = randomUUID();
  auth.money.commissions.push({
    id,
    deal_id: deal.id,
    ...rates,
    expected_base: won,
    expected_closer_amount: share(won, rates.closer_rate),
    expected_subcloser_amount:
      rates.subcloser_id === null ? 0 : share(won, rates.subcloser_rate ?? 0),
  });
  return send(response, 200, JSON.stringify(id));
});

route("POST", "/rest/v1/rpc/cancel_recurring", async ({ request, response }) => {
  const caller = callerOf(request);
  if (!caller) return fail(response, 401, "PGRST301", "JWT invalid");
  const { auth } = caller;
  const body = JSON.parse(await readBody(request));
  auth.calls.money.push({ kind: "cancel-recurring", body });
  if (!isAdmin(caller)) return fail(response, 403, "42501", "forbidden");
  const found = findDeal(auth, body.p_deal_id);
  if (!found) return fail(response, 400, "P0001", "deal_not_found");
  const { deal } = found;
  if (deal.stage !== "won" || deal.recurring_monthly == null) {
    return fail(response, 400, "P0001", "no_recurring");
  }
  if (deal.recurring_cancelled_at) {
    return fail(response, 400, "P0001", "recurring_already_cancelled");
  }
  deal.recurring_cancelled_at = new Date().toISOString().slice(0, 10);
  return sendEmpty(response);
});
