import { bearer, extendAuthState, personById, stateFor } from "./auth.js";
import { pass, readBody, route, send } from "./registry.js";

export const freelanceProjectIds = {
  shop: "60000000-0000-4000-8000-000000000001",
  landing: "60000000-0000-4000-8000-000000000002",
  closed: "60000000-0000-4000-8000-000000000003",
};

function projectRow(overrides) {
  return {
    brief: null,
    phase: "discover",
    status: "active",
    started_at: null,
    due_at: null,
    archived_at: null,
    created_at: "2026-10-01T09:00:00+00:00",
    done: 0,
    total: 0,
    percent: 0,
    ...overrides,
  };
}

const shop = projectRow({
  id: freelanceProjectIds.shop,
  name: "Tienda de Carla",
  brief: "Tienda pequeña con catálogo y contacto.",
  phase: "build",
  due_at: "2026-12-15",
  done: 2,
  total: 8,
  percent: 25,
});

const landing = projectRow({
  id: freelanceProjectIds.landing,
  name: "Landing de la academia",
  phase: "design",
  created_at: "2026-10-20T09:00:00+00:00",
});

const closed = projectRow({
  id: freelanceProjectIds.closed,
  name: "Prueba: landing cerrada",
  phase: "maintain",
  status: "closed",
  archived_at: "2026-09-30T09:00:00+00:00",
  created_at: "2026-08-01T09:00:00+00:00",
  done: 4,
  total: 4,
  percent: 100,
});

const modes = {
  none: [],
  one: [shop],
  two: [shop, landing],
  history: [shop, closed],
  closedOnly: [closed],
};

extendAuthState((state) => {
  state.freelance = { mode: "none", error: null };
});

route("POST", "/__freelance/mode", async ({ request, response, url }) => {
  Object.assign(
    stateFor(url.searchParams.get("tag") ?? "").freelance,
    JSON.parse(await readBody(request)),
  );
  return send(response, 200, { ok: true });
});

function scope(request, response) {
  const session = bearer(request);
  if (!session) {
    send(response, 401, { code: "PGRST301", message: "JWT invalid" });
    return null;
  }
  const person = personById(session.userId)?.[1];
  if (person?.role !== "freelance") return pass;
  if (session.level !== "aal2") {
    send(response, 200, []);
    return null;
  }
  return { session, state: session.auth.freelance };
}

export function freelanceRoute(method, path, handler) {
  route(method, path, (context) => {
    const scoped = scope(context.request, context.response);
    if (scoped === null) return undefined;
    if (scoped === pass) return pass;
    return handler({ ...context, scoped });
  });
}

export function failing(response, state, table) {
  if (state.error !== table && state.error !== "all") return false;
  send(response, 500, { code: "XX000", message: "boom", details: null, hint: null });
  return true;
}

export function visibleProjects(state) {
  return modes[state.mode] ?? [];
}

export function matches(row, key, raw) {
  const [operator, ...rest] = raw.split(".");
  const value = rest.join(".");
  const actual = row[key];
  if (operator === "eq") return String(actual) === value;
  if (operator === "neq") return String(actual) !== value;
  if (operator === "is") return value === "null" ? actual === null || actual === undefined : true;
  if (operator === "in") {
    return value
      .replace(/^\(|\)$/g, "")
      .split(",")
      .includes(String(actual));
  }
  return true;
}

export function query(rows, url) {
  const reserved = new Set(["select", "order", "limit", "offset"]);
  let result = rows.filter((row) =>
    [...url.searchParams.entries()].every(
      ([key, raw]) => reserved.has(key) || matches(row, key, raw),
    ),
  );
  const order = url.searchParams.getAll("order").flatMap((spec) => spec.split(","));
  for (const spec of [...order].reverse()) {
    const [column, direction = "asc"] = spec.split(".");
    const factor = direction === "desc" ? -1 : 1;
    result = [...result].sort((a, b) => {
      const left = a[column] ?? "";
      const right = b[column] ?? "";
      return left < right ? -factor : left > right ? factor : 0;
    });
  }
  const limit = Number(url.searchParams.get("limit") ?? 0);
  return limit > 0 ? result.slice(0, limit) : result;
}

freelanceRoute("GET", "/rest/v1/freelance_projects", ({ response, url, scoped }) => {
  if (failing(response, scoped.state, "projects")) return undefined;
  return send(response, 200, query(visibleProjects(scoped.state), url));
});
