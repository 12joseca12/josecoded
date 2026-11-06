import { bearer, extendAuthState, people, personById } from "./auth.js";
import { route, send } from "./registry.js";

const slowMs = 1500;

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const freelanceBeneficiary = {
  id: "00000000-0000-4000-8000-0000000000f2",
  full_name: "Fran Freelance",
  role: "freelance",
  is_active: true,
  parent_closer_id: null,
  payout_cadence: null,
  closer_rate: null,
  parent_rate: null,
  closer_recurring_rate: null,
  parent_recurring_rate: null,
};

const rates = {
  [people["closer@example.com"].id]: { closer_rate: 10, closer_recurring_rate: 7.5 },
};

extendAuthState((state) => {
  state.calls.profiles = [];
  state.profiles = new Map();
  state.profileEdits = new Map();
});

route("GET", "/rest/v1/profiles", async ({ request, response, url }) => {
  const session = bearer(request);
  session?.auth.calls.profiles.push({ authenticated: true });
  if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
  const accountView = (url.searchParams.get("select") ?? "").includes("locale");
  if (accountView && session.auth.account?.mode.profile === "error") {
    return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
  }
  if (accountView && session.auth.account?.mode.profile === "slow") await pause(slowMs);
  if (url.searchParams.has("parent_closer_id")) {
    const caller = personById(session.userId)?.[1];
    const parent = url.searchParams.get("parent_closer_id").replace("eq.", "");
    if (!caller || session.level !== "aal2" || (caller.role !== "admin" && caller.id !== parent)) {
      return send(response, 200, []);
    }
    return send(
      response,
      200,
      Object.values(people)
        .filter((person) => person.parent === parent)
        .map((person) => ({ id: person.id, full_name: person.name })),
    );
  }
  if (!url.searchParams.has("id") && url.searchParams.has("role")) {
    const caller = personById(session.userId)?.[1];
    if (!caller || session.level !== "aal2") return send(response, 200, []);
    const roleFilter = /^in\.\((.*)\)$/.exec(url.searchParams.get("role") ?? "");
    const roles = roleFilter ? roleFilter[1].split(",") : null;
    const rows = Object.values(people)
      .filter((person) => !person.noProfile)
      .filter((person) => person.role === "admin" || person.role === "closer")
      .filter((person) => url.searchParams.get("is_active") !== "eq.true" || !person.inactive)
      .filter(
        (person) =>
          caller.role === "admin" ||
          (caller.role === "closer" && (person.id === caller.id || person.parent === caller.id)),
      )
      .map((person) => ({
        id: person.id,
        full_name: person.name,
        role: person.role,
        is_active: !person.inactive,
        parent_closer_id: person.parent ?? null,
        payout_cadence: person.cadence ?? null,
        closer_rate: person.rates?.closer ?? null,
        parent_rate: person.rates?.parent ?? null,
        closer_recurring_rate: person.rates?.closerRecurring ?? null,
        parent_recurring_rate: person.rates?.parentRecurring ?? null,
      }))
      .concat(caller.role === "admin" ? [freelanceBeneficiary] : [])
      .filter((row) => roles === null || roles.includes(row.role))
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
    return send(response, 200, rows);
  }
  if (!url.searchParams.has("id") && !url.searchParams.has("role")) {
    const caller = personById(session.userId);
    if (caller?.[1].role !== "admin" || session.level !== "aal2") return send(response, 200, []);
    return send(
      response,
      200,
      Object.values(people).map((person) => ({ id: person.id, full_name: person.name })),
    );
  }
  const id = (url.searchParams.get("id") ?? "").replace("eq.", "");
  const found = personById(id);
  const created = session.auth.profiles.get(session.userId);
  const hasProfile = found && (!found[1].noProfile || created !== undefined);
  const row =
    hasProfile && found[1].id === session.userId
      ? {
          role: created?.role ?? found[1].role,
          full_name:
            session.auth.profileEdits.get(found[1].id)?.full_name ??
            created?.full_name ??
            found[1].name,
          locale: session.auth.profileEdits.get(found[1].id)?.locale ?? "es",
          created_at: "2026-10-01T09:00:00+00:00",
          is_active: !found[1].inactive,
          archived_at: null,
          ...(rates[found[1].id] ?? { closer_rate: null, closer_recurring_rate: null }),
        }
      : null;
  if ((request.headers.accept ?? "").includes("vnd.pgrst.object")) {
    if (!row) {
      return send(response, 406, {
        code: "PGRST116",
        message: "no rows",
        details: "0 rows",
        hint: null,
      });
    }
    return send(response, 200, row);
  }
  return send(response, 200, row ? [row] : []);
});
