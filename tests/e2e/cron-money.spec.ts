import { expect, test } from "@playwright/test";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.55" } });

const route = "/api/cron/money";

test("the overdue check refuses a missing or wrong secret", async ({ request }) => {
  const missing = await request.get(route);
  expect(missing.status()).toBe(401);
  expect(await missing.json()).toEqual({ error: "unauthorized" });
  const wrong = await request.post(route, { headers: { "x-cron-secret": "nope" } });
  expect(wrong.status()).toBe(401);
});

test("the overdue check runs with the right secret and is never cached", async ({ request }) => {
  const response = await request.post(route, { headers: { "x-cron-secret": "test-cron-secret" } });
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual({ notified: 1 });
  const get = await request.get(route, { headers: { "x-cron-secret": "test-cron-secret" } });
  expect(get.status()).toBe(200);
});
