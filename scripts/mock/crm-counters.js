import { bearer, extendAuthState, personById, stateFor } from "./auth.js";
import { canSee } from "./crm.js";
import { inboxRows } from "./inbox.js";
import { readBody, route, send } from "./registry.js";

const openStages = ["new", "contacted", "meeting", "proposal"];

extendAuthState((state) => {
  state.countersMode = "data";
});

route("POST", "/__auth/counters-mode", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").countersMode = JSON.parse(
    await readBody(request),
  ).mode;
  return send(response, 200, { ok: true });
});

function tomorrowStart(now) {
  const madrid = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [year, month, day] = madrid.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, day + 1);
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date(guess))
    .find((part) => part.type === "timeZoneName")?.value;
  const hours = Number(/GMT([+-]\d+)/.exec(offset ?? "")?.[1] ?? 0);
  return guess - hours * 3_600_000;
}

route("POST", "/rest/v1/rpc/crm_counters", ({ request, response }) => {
  const session = bearer(request);
  if (!session) {
    return send(response, 401, {
      code: "PGRST301",
      message: "JWT invalid",
      details: null,
      hint: null,
    });
  }
  const person = personById(session.userId)?.[1];
  const allowed =
    person && session.level === "aal2" && (person.role === "admin" || person.role === "closer");
  if (!allowed) {
    return send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
  }
  const { auth } = session;
  if (auth.countersMode === "error") {
    return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
  }
  if (auth.countersMode === "missing") {
    return send(response, 404, {
      code: "PGRST202",
      message: "Could not find the function public.crm_counters",
      details: null,
      hint: null,
    });
  }
  const caller = { session, auth, person };
  const now = Date.now();
  const tomorrow = tomorrowStart(new Date(now));
  const contacts = auth.contacts.filter((contact) => canSee(caller, contact));
  const at = (contact) => (contact.next_action_at ? Date.parse(contact.next_action_at) : null);
  const deals = contacts.flatMap((contact) => contact.deals);
  const stage = (name) => deals.filter((deal) => deal.stage === name).length;
  return send(response, 200, [
    {
      inbox_new: inboxRows(auth).length,
      actions_overdue: contacts.filter((contact) => at(contact) !== null && at(contact) < now)
        .length,
      actions_today: contacts.filter(
        (contact) => at(contact) !== null && at(contact) >= now && at(contact) < tomorrow,
      ).length,
      ...Object.fromEntries(openStages.map((name) => [`deals_${name}`, stage(name)])),
    },
  ]);
});
