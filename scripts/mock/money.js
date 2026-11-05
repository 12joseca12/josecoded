import { randomUUID } from "node:crypto";

import { extendAuthState, people, stateFor } from "./auth.js";
import { callerOf, canSee, fail } from "./crm.js";
import { readBody, route, send, sendEmpty } from "./registry.js";

const cleo = "00000000-0000-4000-8000-0000000000c1";
const serviceKey = "test-service-role-key";
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
    .sort((a, b) => a.sort - b.sort)
    .map((item) => ({ ...item, deals: dealRef(caller.auth, item.deal_id) }));
  return send(response, 200, rows);
});

route("GET", "/rest/v1/invoices", ({ request, response, url }) => {
  const caller = guard(request, response, "list-invoices", url);
  if (!caller) return undefined;
  if (!isAdmin(caller)) return send(response, 200, []);
  const ids = inValues(url, "deal_id");
  const byId = /^eq\.(.+)$/.exec(url.searchParams.get("id") ?? "")?.[1];
  const byKind = /^eq\.(.+)$/.exec(url.searchParams.get("kind") ?? "")?.[1];
  const rows = caller.auth.money.invoices
    .filter((invoice) => (ids === null ? true : ids.includes(invoice.deal_id)))
    .filter((invoice) => (byId === undefined ? true : invoice.id === byId))
    .filter((invoice) => (byKind === undefined ? true : invoice.kind === byKind))
    .sort((a, b) => b.issued_at.localeCompare(a.issued_at))
    .map((invoice) => ({
      ...invoice,
      deals: dealRef(caller.auth, invoice.deal_id),
      payment_schedule: scheduleRef(caller.auth, invoice.schedule_id),
    }));
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

function scheduleRef(auth, scheduleId) {
  const item = auth.money.schedule.find((entry) => entry.id === scheduleId);
  return item ? { label: item.label, due_at: item.due_at } : null;
}

function dealRef(auth, dealId) {
  const found = findDeal(auth, dealId);
  return found
    ? {
        contacts: {
          full_name: found.contact.full_name,
          organization: found.contact.organization ?? null,
        },
      }
    : null;
}

route("GET", "/rest/v1/payments", ({ request, response }) => {
  const caller = guard(request, response, "list-payments", undefined);
  if (!caller) return undefined;
  if (!isAdmin(caller)) return send(response, 200, []);
  return send(
    response,
    200,
    caller.auth.money.payments
      .filter((payment) => payment.schedule_id !== null)
      .map(({ schedule_id, kind, amount_net }) => ({ schedule_id, kind, amount_net })),
  );
});

function failure(response, message) {
  return fail(response, 400, "P0001", message);
}

function adminOnly(request, response, kind, body) {
  const caller = callerOf(request);
  if (!caller) {
    fail(response, 401, "PGRST301", "JWT invalid");
    return null;
  }
  caller.auth.calls.money.push({ kind, body });
  if (!isAdmin(caller)) {
    fail(response, 403, "42501", "forbidden");
    return null;
  }
  if (caller.auth.moneyMode === "write-error") {
    fail(response, 500, "XX000", "internal");
    return null;
  }
  return caller;
}

function accrue(auth, payment) {
  const header = auth.money.commissions.find((entry) => entry.deal_id === payment.deal_id);
  if (!header) return;
  const sign = payment.kind === "refund" ? -1 : 1;
  const recurring = payment.nature === "recurring";
  const entries = [
    {
      beneficiary: header.closer_id,
      role: header.subcloser_id === null ? "closer" : "parent",
      rate: recurring ? header.closer_recurring_rate : header.closer_rate,
    },
  ];
  if (header.subcloser_id !== null) {
    entries.push({
      beneficiary: header.subcloser_id,
      role: "closer",
      rate: recurring ? header.subcloser_recurring_rate : header.subcloser_rate,
    });
  }
  for (const entry of entries) {
    if (!entry.rate) continue;
    auth.money.lines.push({
      id: randomUUID(),
      commission_id: header.id,
      payment_id: payment.id,
      payout_id: null,
      beneficiary_id: entry.beneficiary,
      role: entry.role,
      nature: payment.nature,
      rate: entry.rate,
      base: sign * payment.amount_net,
      amount: sign * share(payment.amount_net, entry.rate),
      status: "accrued",
      rejected_reason: null,
      created_at: new Date().toISOString(),
    });
  }
}

function netPaid(auth, scheduleId) {
  return auth.money.payments
    .filter((payment) => payment.schedule_id === scheduleId)
    .reduce((sum, payment) => sum + (payment.kind === "refund" ? -1 : 1) * payment.amount_net, 0);
}

route("POST", "/rest/v1/rpc/record_payment", async ({ request, response }) => {
  const body = JSON.parse(await readBody(request));
  const caller = adminOnly(request, response, "record-payment", body);
  if (!caller) return undefined;
  const { auth } = caller;
  const found = findDeal(auth, body.p_deal_id);
  if (!found) return failure(response, "deal_not_found");
  if (found.deal.stage !== "won") return failure(response, "deal_not_won");
  if (typeof body.p_amount_net !== "number" || body.p_amount_net <= 0) {
    return failure(response, "invalid_amount");
  }
  if (body.p_received_at > new Date().toISOString().slice(0, 10)) {
    return failure(response, "future_date");
  }
  if (body.p_nature === "recurring" && found.deal.recurring_monthly == null) {
    return failure(response, "no_recurring");
  }
  const item = body.p_schedule_id
    ? auth.money.schedule.find((entry) => entry.id === body.p_schedule_id)
    : null;
  if (body.p_schedule_id && (!item || item.deal_id !== body.p_deal_id)) {
    return failure(response, "schedule_mismatch");
  }
  if (item && item.status === "cancelled") return failure(response, "schedule_cancelled");
  if (item && (item.kind === "milestone") !== (body.p_nature === "project")) {
    return failure(response, "nature_mismatch");
  }
  if (item && body.p_kind === "payment") {
    const paid = netPaid(auth, item.id);
    if (cents(paid) + cents(body.p_amount_net) > cents(item.amount)) {
      return failure(response, "payment_exceeds_schedule");
    }
  }
  if (
    item &&
    body.p_kind === "refund" &&
    cents(body.p_amount_net) > cents(netPaid(auth, item.id))
  ) {
    return failure(response, "refund_exceeds_paid");
  }
  const payment = {
    id: randomUUID(),
    deal_id: body.p_deal_id,
    schedule_id: body.p_schedule_id ?? null,
    invoice_id: body.p_invoice_id ?? null,
    kind: body.p_kind,
    nature: body.p_nature,
    amount_net: body.p_amount_net,
    received_at: body.p_received_at,
    method: body.p_method,
    reference: body.p_reference ?? null,
  };
  auth.money.payments.push(payment);
  if (
    payment.kind === "payment" &&
    payment.nature === "recurring" &&
    !found.deal.recurring_started_at
  ) {
    found.deal.recurring_started_at = payment.received_at;
  }
  accrue(auth, payment);
  if (item) {
    item.status = cents(netPaid(auth, item.id)) >= cents(item.amount) ? "paid" : item.status;
  }
  return send(response, 200, JSON.stringify(payment.id));
});

route("POST", "/rest/v1/rpc/set_payment_schedule", async ({ request, response }) => {
  const body = JSON.parse(await readBody(request));
  const caller = adminOnly(request, response, "set-schedule", body);
  if (!caller) return undefined;
  const { auth } = caller;
  const found = findDeal(auth, body.p_deal_id);
  if (!found) return failure(response, "deal_not_found");
  if (found.deal.stage !== "won") return failure(response, "deal_not_won");
  const items = body.p_items;
  if (!Array.isArray(items) || items.length === 0) return failure(response, "invalid_schedule");
  if (items.some((item) => !item.label || !(item.amount > 0))) {
    return failure(response, "invalid_schedule");
  }
  const kept = auth.money.schedule.filter(
    (entry) => entry.deal_id !== body.p_deal_id || entry.status !== "scheduled",
  );
  const milestoneTotal = [...kept.filter((entry) => entry.deal_id === body.p_deal_id), ...items]
    .filter((entry) => (entry.kind ?? "milestone") === "milestone" && entry.status !== "cancelled")
    .reduce((sum, entry) => sum + cents(entry.amount), 0);
  if (milestoneTotal > 0 && milestoneTotal !== cents(found.deal.won_amount)) {
    return failure(response, "schedule_total_mismatch");
  }
  auth.money.schedule = kept;
  items.forEach((item, index) => {
    auth.money.schedule.push({
      id: randomUUID(),
      deal_id: body.p_deal_id,
      label: item.label,
      kind: item.kind,
      percent: item.percent ?? null,
      amount: item.amount,
      due_at: item.due_at ?? null,
      status: "scheduled",
      sort: index + 1,
    });
  });
  return send(response, 200, items.length);
});

route("POST", "/rest/v1/rpc/issue_proforma", async ({ request, response }) => {
  const body = JSON.parse(await readBody(request));
  const caller = adminOnly(request, response, "issue-proforma", body);
  if (!caller) return undefined;
  const { auth } = caller;
  const item = auth.money.schedule.find((entry) => entry.id === body.p_schedule_id);
  if (!item) return failure(response, "schedule_not_found");
  if (item.status === "proforma_sent") return failure(response, "proforma_already_issued");
  if (item.status !== "scheduled") return failure(response, "schedule_not_issuable");
  const vat = body.p_vat_rate ?? 0;
  const year = new Date().getFullYear();
  const count = auth.money.invoices.filter((entry) => entry.kind === "proforma").length + 1;
  const net = item.amount;
  const vatAmount = share(net, vat);
  const invoice = {
    id: randomUUID(),
    deal_id: item.deal_id,
    schedule_id: item.id,
    kind: "proforma",
    number: `PF-${String(year)}-${String(count).padStart(3, "0")}`,
    issued_at: new Date().toISOString().slice(0, 10),
    amount_net: net,
    vat_rate: vat,
    vat_amount: vatAmount,
    amount_gross: Math.round((net + vatAmount) * 100) / 100,
    pdf_path: null,
    status: "sent",
  };
  auth.money.invoices.push(invoice);
  item.status = "proforma_sent";
  return send(response, 200, JSON.stringify(invoice.id));
});

route("POST", "/rest/v1/rpc/record_invoice", async ({ request, response }) => {
  const body = JSON.parse(await readBody(request));
  const caller = adminOnly(request, response, "record-invoice", body);
  if (!caller) return undefined;
  const { auth } = caller;
  if (String(body.p_number).toUpperCase().startsWith("PF-")) {
    return failure(response, "invoice_number_reserved");
  }
  if (
    auth.money.invoices.some((entry) => entry.kind === "invoice" && entry.number === body.p_number)
  ) {
    return failure(response, "invoice_number_taken");
  }
  const item = body.p_schedule_id
    ? auth.money.schedule.find((entry) => entry.id === body.p_schedule_id)
    : null;
  if (body.p_schedule_id && !item) return failure(response, "schedule_mismatch");
  const vatAmount = share(body.p_net, body.p_vat_rate);
  const invoice = {
    id: randomUUID(),
    deal_id: body.p_deal_id,
    schedule_id: body.p_schedule_id ?? null,
    kind: "invoice",
    number: body.p_number,
    issued_at: body.p_issued_at,
    amount_net: body.p_net,
    vat_rate: body.p_vat_rate,
    vat_amount: vatAmount,
    amount_gross: Math.round((body.p_net + vatAmount) * 100) / 100,
    pdf_path: body.p_pdf_path ?? null,
    status: "sent",
  };
  auth.money.invoices.push(invoice);
  if (item && ["scheduled", "proforma_sent"].includes(item.status)) item.status = "invoiced";
  return send(response, 200, JSON.stringify(invoice.id));
});

route("POST", "/rest/v1/rpc/cancel_schedule_item", async ({ request, response }) => {
  const body = JSON.parse(await readBody(request));
  const caller = adminOnly(request, response, "cancel-item", body);
  if (!caller) return undefined;
  const { auth } = caller;
  const item = auth.money.schedule.find((entry) => entry.id === body.p_id);
  if (!item) return failure(response, "schedule_not_found");
  if (
    item.status === "paid" ||
    auth.money.payments.some((entry) => entry.schedule_id === item.id)
  ) {
    return failure(response, "schedule_has_payments");
  }
  if (
    auth.money.invoices.some(
      (entry) =>
        entry.schedule_id === item.id && entry.kind === "invoice" && entry.status !== "void",
    )
  ) {
    return failure(response, "schedule_has_invoice");
  }
  for (const invoice of auth.money.invoices) {
    if (invoice.schedule_id === item.id && invoice.kind === "proforma") invoice.status = "void";
  }
  item.status = "cancelled";
  return sendEmpty(response);
});

route("POST", "/rest/v1/rpc/void_invoice", async ({ request, response }) => {
  const body = JSON.parse(await readBody(request));
  const caller = adminOnly(request, response, "void-invoice", body);
  if (!caller) return undefined;
  const { auth } = caller;
  const invoice = auth.money.invoices.find((entry) => entry.id === body.p_id);
  if (!invoice) return failure(response, "invoice_not_found");
  if (["paid", "void"].includes(invoice.status)) return failure(response, "invoice_not_voidable");
  if (auth.money.payments.some((entry) => entry.invoice_id === invoice.id)) {
    return failure(response, "invoice_has_payments");
  }
  invoice.status = "void";
  const item = auth.money.schedule.find((entry) => entry.id === invoice.schedule_id);
  if (item && ["proforma_sent", "invoiced"].includes(item.status)) item.status = "scheduled";
  return sendEmpty(response);
});

let storageMode = "ok";
const storageCalls = [];

function serviceOnly(request, response) {
  if (request.headers.authorization === `Bearer ${serviceKey}`) return true;
  fail(response, 401, "PGRST301", "JWT invalid");
  return false;
}

route("GET", "/__auth/storage", ({ response }) => send(response, 200, storageCalls));

route("POST", "/__auth/storage-mode", async ({ request, response }) => {
  storageMode = JSON.parse(await readBody(request)).mode;
  return send(response, 200, { ok: true });
});

route("POST", /^\/storage\/v1\/object\/billing\/(.+)$/, async ({ request, response, match }) => {
  if (!serviceOnly(request, response)) return undefined;
  const raw = await readBody(request);
  const path = decodeURIComponent(match[1]);
  storageCalls.push({ kind: "upload", path, size: raw.length });
  if (storageMode === "upload-error") return fail(response, 500, "XX000", "storage");
  return send(response, 200, { Key: `billing/${match[1]}`, Id: randomUUID() });
});

route("DELETE", /^\/storage\/v1\/object\/billing$/, async ({ request, response }) => {
  if (!serviceOnly(request, response)) return undefined;
  const body = JSON.parse(await readBody(request));
  storageCalls.push({ kind: "remove", paths: body.prefixes });
  return send(response, 200, []);
});

route(
  "POST",
  /^\/storage\/v1\/object\/sign\/billing\/(.+)$/,
  async ({ request, response, match }) => {
    if (!serviceOnly(request, response)) return undefined;
    const path = decodeURIComponent(match[1]);
    storageCalls.push({ kind: "sign", path });
    return send(response, 200, { signedURL: `/object/sign/billing/${match[1]}?token=mock-token` });
  },
);

route("GET", /^\/storage\/v1\/object\/sign\/billing\/(.+)$/, ({ response }) =>
  send(response, 200, "%PDF-1.4\n%mock\n", "application/pdf"),
);
