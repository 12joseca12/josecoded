import { bearer, extendAuthState, people, personById } from "./auth.js";
import { route, send } from "./registry.js";

extendAuthState((state) => {
  state.calls.profiles = [];
  state.profiles = new Map();
});

route("GET", "/rest/v1/profiles", ({ request, response, url }) => {
  const session = bearer(request);
  session?.auth.calls.profiles.push({ authenticated: true });
  if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
  if (!url.searchParams.has("id") && url.searchParams.has("role")) {
    const caller = personById(session.userId)?.[1];
    if (!caller || session.level !== "aal2") return send(response, 200, []);
    const rows = Object.values(people)
      .filter((person) => !person.noProfile)
      .filter((person) => person.role === "admin" || person.role === "closer")
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
        closer_rate: person.rates?.closer ?? null,
        parent_rate: person.rates?.parent ?? null,
        closer_recurring_rate: person.rates?.closerRecurring ?? null,
        parent_recurring_rate: person.rates?.parentRecurring ?? null,
      }))
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
          full_name: created?.full_name ?? found[1].name,
          is_active: !found[1].inactive,
          archived_at: null,
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
