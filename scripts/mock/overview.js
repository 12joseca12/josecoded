import { extendAuthState, stateFor } from "./auth.js";
import { readBody, route, send } from "./registry.js";
import { admin, deny, failure } from "./system.js";

const fullCounters = {
  leads_new: 3,
  leads_waiting_admin: 1,
  invitations_pending: 2,
  users_active: 4,
  accrued_pending_count: 2,
  accrued_pending_amount: 1234.5,
  payments_overdue: 1,
  proformas_unpaid: 5,
  payouts_draft: 0,
  jobs_failed: 2,
  stories_to_decide: 3,
  fee_items_pending: 2,
};

const partialCounters = {
  leads_new: 3,
  leads_waiting_admin: 1,
  invitations_pending: 2,
  users_active: 4,
};

extendAuthState((state) => {
  state.countersMode = "partial";
  state.auditMode = "data";
  state.calls.counters = 0;
});

route("POST", "/__auth/overview-mode", async ({ request, response, url }) => {
  Object.assign(stateFor(url.searchParams.get("tag") ?? ""), JSON.parse(await readBody(request)));
  return send(response, 200, { ok: true });
});

route("POST", "/__auth/audit-seed", async ({ request, response, url }) => {
  const auth = stateFor(url.searchParams.get("tag") ?? "");
  const entries = JSON.parse(await readBody(request));
  for (const entry of entries) {
    auth.audit.push({
      id: auth.audit.length + 1,
      at: new Date().toISOString(),
      actor_id: null,
      actor_name: "Jose Enrolled",
      table_name: "leads",
      row_id: null,
      action: "update",
      before: null,
      after: null,
      ...entry,
    });
  }
  return send(response, 200, { count: auth.audit.length });
});

route("POST", "/rest/v1/rpc/admin_counters", ({ request, response }) => {
  const who = admin(request);
  if (who.denied) return deny(response, who);
  const { auth } = who.session;
  auth.calls.counters += 1;
  if (auth.countersMode === "error") return failure(response);
  if (auth.countersMode === "missing") return failure(response, "PGRST202", "no function");
  if (auth.countersMode === "full") return send(response, 200, fullCounters);
  if (auth.countersMode === "zero") {
    return send(
      response,
      200,
      Object.fromEntries(Object.keys(fullCounters).map((key) => [key, 0])),
    );
  }
  return send(response, 200, partialCounters);
});
