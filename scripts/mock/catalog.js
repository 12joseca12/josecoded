import { route, send } from "./registry.js";

const mode = process.env.MOCK_CATALOG ?? "empty";

const extraSlugs = [
  "accounts",
  "admin",
  "payments",
  "languages",
  "seo",
  "analytics",
  "ai",
  "push",
  "offline",
  "stores",
  "brand",
];

const pricedOffers = {
  "web-presencia": 1200,
  "web-negocio": 2400,
  "web-plataforma": 5000,
  "app-primera-version": 4000,
  "app-producto": 8000,
};

const weeks = {
  "web-presencia": [2, 3],
  "web-negocio": [4, 6],
  "web-plataforma": [8, 14],
  "app-primera-version": [6, 10],
  "app-producto": [10, 16],
};

const priced = mode === "priced";

const catalog = {
  public_offers: Object.keys(weeks).map((slug, index) => ({
    slug,
    price: priced ? pricedOffers[slug] : null,
    weeks_min: weeks[slug][0],
    weeks_max: weeks[slug][1],
    sort: (index + 1) * 10,
  })),
  public_extras: extraSlugs.map((slug, index) => ({
    slug,
    price: priced ? 100 : null,
    sort: (index + 1) * 10,
  })),
  public_rates: [
    { code: "hourly", price: priced ? 60 : null },
    { code: "task_min", price: priced ? 150 : null },
  ],
  public_maintenance_plans: [
    { slug: "s", price_monthly: priced ? 49 : null, sort: 10 },
    { slug: "m", price_monthly: priced ? 99 : null, sort: 20 },
    { slug: "l", price_monthly: priced ? 199 : null, sort: 30 },
  ],
};

let reads = 0;

route("GET", "/__catalog/calls", ({ response }) => send(response, 200, { reads, mode }));

route(
  "GET",
  /^\/rest\/v1\/(public_offers|public_extras|public_rates|public_maintenance_plans)$/,
  ({ request, response, match }) => {
    reads += 1;
    if (mode === "down") {
      return send(response, 404, {
        code: "PGRST205",
        message: "relation does not exist",
        details: null,
        hint: null,
      });
    }
    if (!(request.headers.authorization ?? "").startsWith("Bearer ")) {
      return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
    }
    return send(response, 200, catalog[match[1]]);
  },
);
