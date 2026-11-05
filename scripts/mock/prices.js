import { bearer, extendAuthState, personById, stateFor } from "./auth.js";
import { readBody, route, send } from "./registry.js";

const base = Date.parse("2026-11-05T10:00:00.000Z");

function stamp(step) {
  return new Date(base + step * 1000).toISOString().replace("Z", "000+00:00");
}

function seededPrices() {
  const at = stamp(0);
  const offer = (slug, platform, es, en, min, max, sort) => ({
    slug,
    platform,
    name_es: es,
    name_en: en,
    price: null,
    weeks_min: min,
    weeks_max: max,
    visible: true,
    sort,
    archived_at: null,
    updated_at: at,
  });
  const extra = (slug, es, en, billing, sort) => ({
    slug,
    name_es: es,
    name_en: en,
    price: null,
    billing,
    visible: true,
    sort,
    archived_at: null,
    updated_at: at,
  });
  const plan = (slug, name, sort) => ({
    slug,
    name_es: name,
    name_en: name,
    price_monthly: null,
    visible: true,
    sort,
    archived_at: null,
    updated_at: at,
  });
  return {
    clock: 0,
    offers: [
      offer("web-presencia", "web", "Presencia", "Presence", 2, 3, 10),
      offer("web-negocio", "web", "Negocio", "Business", 4, 6, 20),
      offer("web-plataforma", "web", "Plataforma", "Platform", 8, 14, 30),
      offer("app-primera-version", "app", "Primera versión", "First version", 6, 10, 40),
      offer("app-producto", "app", "Producto", "Product", 10, 16, 50),
    ],
    extras: [
      extra("accounts", "Cuentas y permisos", "Accounts and permissions", "once", 10),
      extra("admin", "Panel de gestión", "Management panel", "once", 20),
      extra("languages", "Idiomas", "Languages", "per_unit", 30),
      extra("seo", "Posicionamiento", "SEO", "once", 40),
    ],
    rates: [
      {
        code: "hourly",
        label_es: "Por hora",
        label_en: "Per hour",
        price: null,
        visible: true,
        sort: 10,
        updated_at: at,
      },
      {
        code: "task_min",
        label_es: "Por tarea",
        label_en: "Per task",
        price: null,
        visible: true,
        sort: 20,
        updated_at: at,
      },
    ],
    maintenance_plans: [plan("s", "Plan S", 10), plan("m", "Plan M", 20), plan("l", "Plan L", 30)],
    price_changes: [],
  };
}

const keyColumn = { offers: "slug", extras: "slug", rates: "code", maintenance_plans: "slug" };
const tracked = ["price", "price_monthly", "visible", "archived_at"];

extendAuthState((state) => {
  state.calls.prices = [];
  state.prices = seededPrices();
  state.pricesMode = "data";
  state.pricesWriteError = null;
});

route("POST", "/__auth/prices-mode", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").pricesMode = JSON.parse(await readBody(request)).mode;
  return send(response, 200, { ok: true });
});

route("POST", "/__auth/prices-write-error", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").pricesWriteError = JSON.parse(
    await readBody(request),
  ).error;
  return send(response, 200, { ok: true });
});

route("POST", "/__auth/prices-bump", async ({ request, response, url }) => {
  const auth = stateFor(url.searchParams.get("tag") ?? "");
  const { table, key } = JSON.parse(await readBody(request));
  const row = auth.prices[table].find((entry) => entry[keyColumn[table]] === key);
  if (row) row.updated_at = stamp(++auth.prices.clock);
  return send(response, 200, { ok: true });
});

function isAdmin(session) {
  return personById(session.userId)?.[1].role === "admin" && session.level === "aal2";
}

route(
  "GET",
  /^\/rest\/v1\/(offers|extras|rates|maintenance_plans)$/,
  ({ request, response, match }) => {
    const session = bearer(request);
    if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
    const auth = session.auth;
    auth.calls.prices.push({ method: "GET", table: match[1], level: session.level });
    if (auth.pricesMode === "error") {
      return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
    }
    if (!isAdmin(session) || auth.pricesMode === "empty") return send(response, 200, []);
    const rows = [...auth.prices[match[1]]].sort((a, b) => a.sort - b.sort);
    return send(response, 200, rows);
  },
);

route("GET", "/rest/v1/price_changes", ({ request, response }) => {
  const session = bearer(request);
  if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
  const auth = session.auth;
  if (auth.pricesMode === "error") {
    return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
  }
  if (!isAdmin(session)) return send(response, 200, []);
  return send(response, 200, auth.prices.price_changes);
});

route(
  "PATCH",
  /^\/rest\/v1\/(offers|extras|rates|maintenance_plans)$/,
  async ({ request, response, url, match }) => {
    const session = bearer(request);
    if (!session) return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
    const auth = session.auth;
    const table = match[1];
    const patch = JSON.parse(await readBody(request));
    const column = keyColumn[table];
    const filters = {
      key: (url.searchParams.get(column) ?? "").replace(/^eq\./, ""),
      updatedAt: (url.searchParams.get("updated_at") ?? "").replace(/^eq\./, ""),
    };
    auth.calls.prices.push({ method: "PATCH", table, filters, patch, level: session.level });
    if (!isAdmin(session)) return send(response, 200, []);
    if (auth.pricesWriteError) {
      return send(response, 400, { details: null, hint: null, ...auth.pricesWriteError });
    }
    const row = auth.prices[table].find(
      (entry) =>
        entry[column] === filters.key &&
        (filters.updatedAt === "" || entry.updated_at === filters.updatedAt),
    );
    if (!row) return send(response, 200, []);
    for (const field of tracked) {
      if (field in patch && patch[field] !== row[field]) {
        auth.prices.price_changes.unshift({
          id: auth.prices.price_changes.length + 1,
          table_name: table,
          row_id: filters.key,
          field,
          before: row[field] === null ? null : String(row[field]),
          after: patch[field] === null ? null : String(patch[field]),
          changed_by: session.userId,
          changed_at: stamp(++auth.prices.clock),
        });
      }
    }
    Object.assign(row, patch, { updated_at: stamp(++auth.prices.clock) });
    return send(response, 200, [{ [column]: row[column] }]);
  },
);
