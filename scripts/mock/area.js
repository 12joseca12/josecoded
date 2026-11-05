import { bearer, extendAuthState, personById, stateFor } from "./auth.js";
import { readBody, route, send } from "./registry.js";

const stamp = "2026-11-05T09:00:00+00:00";

export const areaProjects = {
  "10000000-0000-4000-8000-000000000001": {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Web de la panadería",
    phase: "build",
    status: "active",
    created_at: "2026-10-20T09:00:00+00:00",
  },
  "10000000-0000-4000-8000-000000000002": {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Tienda de cerámica",
    phase: "discover",
    status: "active",
    created_at: "2026-09-01T09:00:00+00:00",
  },
};

const [firstId, secondId] = Object.keys(areaProjects);

const modes = {
  none: [],
  one: [firstId],
  two: [firstId, secondId],
};

extendAuthState((state) => {
  state.area = { mode: "none", error: false, stamp };
  state.calls.projects = 0;
});

route("POST", "/__area/mode", async ({ request, response, url }) => {
  const auth = stateFor(url.searchParams.get("tag") ?? "");
  Object.assign(auth.area, JSON.parse(await readBody(request)));
  return send(response, 200, { ok: true });
});

route("GET", "/rest/v1/projects", ({ request, response }) => {
  const session = bearer(request);
  if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
  const { auth } = session;
  auth.calls.projects += 1;
  if (auth.area.error) {
    return send(response, 500, { code: "XX000", message: "boom", details: null, hint: null });
  }
  const person = personById(session.userId)?.[1];
  const ids = person?.role === "client" ? modes[auth.area.mode] : [];
  return send(
    response,
    200,
    ids.map((id) => areaProjects[id]),
  );
});
