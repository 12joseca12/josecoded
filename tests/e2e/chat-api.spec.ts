import { type APIRequestContext, expect, test } from "@playwright/test";

import {
  badTurnstile,
  getThread,
  goodTurnstile,
  omen,
  uniqueText,
  visitorCookie,
  visitorTokenHash,
} from "./support/chat";
import { mockOrigin } from "./support/staff";

const secondsInWeek = 7 * 24 * 60 * 60;

function send(request: APIRequestContext, data: object) {
  return request.post("/api/chat/send", { data });
}

test("the first send needs Turnstile, sets the cookie and the next send does not", async ({
  request,
}) => {
  const body = uniqueText("primera");
  const missing = await send(request, { body, locale: "es" });
  expect(missing.status()).toBe(403);
  expect(await missing.json()).toEqual({ status: "verification_failed" });
  expect(await visitorTokenHash(request)).toBeNull();

  const rejected = await send(request, { body, locale: "es", turnstileToken: badTurnstile });
  expect(rejected.status()).toBe(403);

  const first = await send(request, {
    body,
    locale: "es",
    pagePath: "/es/servicios",
    turnstileToken: goodTurnstile,
  });
  expect(first.status()).toBe(200);
  expect(await first.json()).toMatchObject({ status: "sent" });

  const cookie = await visitorCookie(request);
  expect(cookie).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });
  expect(cookie?.value).toMatch(/^[0-9a-f]{64}\.[0-9a-f]{32}$/);
  const lifetime = (cookie?.expires ?? 0) - Date.now() / 1000;
  expect(lifetime).toBeGreaterThan(secondsInWeek - 120);
  expect(lifetime).toBeLessThanOrEqual(secondsInWeek);

  const second = await send(request, { body: uniqueText("segunda"), locale: "es" });
  expect(second.status()).toBe(200);

  const calls = (await (await request.get(`${mockOrigin}/__chat/calls`)).json()) as {
    send: { p_body: string; p_page_path: string | null; p_locale: string; p_ip_hash: string }[];
  };
  const recorded = calls.send.find((entry) => entry.p_body === body);
  expect(recorded).toMatchObject({ p_page_path: "/es/servicios", p_locale: "es" });
  expect(recorded?.p_ip_hash).toMatch(/^[0-9a-f]{64}$/);
});

test("a forged cookie does not skip Turnstile", async ({ request }) => {
  const forged = `${"a".repeat(64)}.${"b".repeat(32)}`;
  const response = await request.post("/api/chat/send", {
    data: { body: uniqueText("falsa"), locale: "es" },
    headers: { cookie: `jc_visitor=${forged}` },
  });
  expect(response.status()).toBe(403);
});

test("invalid input answers 400 and never reaches the database", async ({ request }) => {
  for (const data of [
    { body: "   ", locale: "es", turnstileToken: goodTurnstile },
    { body: "x".repeat(2001), locale: "es", turnstileToken: goodTurnstile },
    { body: "hola", locale: "fr", turnstileToken: goodTurnstile },
    { body: "hola", locale: "es", pagePath: "no-slash", turnstileToken: goodTurnstile },
    { body: "hola", locale: "es", turnstileToken: goodTurnstile, extra: true },
  ]) {
    const response = await send(request, data);
    expect(response.status(), JSON.stringify(data).slice(0, 60)).toBe(400);
    expect(await response.json()).toEqual({ status: "invalid" });
  }
});

test("typed database errors reach the visitor as their own status", async ({ request }) => {
  const cases: [string, number, string][] = [
    ["[burst] rápido", 429, "burst"],
    ["[quota] mucho", 429, "quota"],
    ["[closed] cerrado", 409, "closed"],
    ["[down] caído", 503, "unavailable"],
  ];
  for (const [body, http, status] of cases) {
    const response = await send(request, { body, locale: "es", turnstileToken: goodTurnstile });
    expect(response.status(), body).toBe(http);
    expect(await response.json()).toEqual({ status });
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
});

test("the thread maps authors, system events and Nexo's state", async ({ request }) => {
  await send(request, { body: uniqueText("hilo"), locale: "es", turnstileToken: goodTurnstile });
  const hash = await visitorTokenHash(request);
  expect(hash).not.toBeNull();
  if (!hash) return;

  const initial = await getThread(request);
  expect(initial.state).toEqual({
    nexoOnline: false,
    aiEnabled: true,
    pendingReply: true,
    handoffDone: false,
    closed: false,
  });
  expect(initial.messages).toHaveLength(1);
  expect(initial.messages[0]).toMatchObject({ author: "visitor", sources: [], systemEvent: null });

  await omen(request, hash, "online");
  await omen(request, hash, "reply", { body: "Hola, soy Nexo", sources: ["Servicios › A medida"] });
  await omen(request, hash, "takeover");
  await omen(request, hash, "staff", { body: "Aquí Jose" });
  const later = await getThread(request);
  expect(later.messages.map((entry) => entry.author)).toEqual([
    "visitor",
    "nexo",
    "system",
    "staff",
  ]);
  expect(later.messages[1]?.sources).toEqual(["Servicios › A medida"]);
  expect(later.messages[2]?.systemEvent).toBe("ai_off");
  expect(later.state).toMatchObject({ nexoOnline: true, aiEnabled: false, pendingReply: false });

  const since = later.messages[1]?.createdAt ?? "";
  const tail = await getThread(request, `?since=${encodeURIComponent(since)}`);
  expect(tail.messages.map((entry) => entry.author)).toEqual(["system", "staff"]);
  expect((await request.get("/api/chat/thread?since=ayer")).status()).toBe(400);
});

test("without a cookie the thread is empty and the stream has nothing to follow", async ({
  request,
}) => {
  const thread = await request.get("/api/chat/thread");
  expect(thread.status()).toBe(200);
  expect(await thread.json()).toMatchObject({ messages: [], state: { nexoOnline: false } });
  expect((await request.get("/api/chat/stream")).status()).toBe(204);
});

test("the handoff needs the visitor's cookie and creates the lead", async ({ request }) => {
  const input = {
    name: "Vera Visita",
    email: `vera+${uniqueText("h").replace(" ", "")}@example.com`,
    consent: true,
  };
  expect((await request.post("/api/chat/handoff", { data: input })).status()).toBe(409);

  await send(request, { body: uniqueText("handoff"), locale: "es", turnstileToken: goodTurnstile });
  expect(
    (await request.post("/api/chat/handoff", { data: { ...input, consent: false } })).status(),
  ).toBe(400);
  const noContact = await request.post("/api/chat/handoff", { data: { consent: true } });
  expect(noContact.status()).toBe(400);
  expect(await noContact.json()).toEqual({
    status: "invalid",
    errors: { email: "contact_required" },
  });

  const saved = await request.post("/api/chat/handoff", { data: input });
  expect(saved.status()).toBe(200);
  expect(await saved.json()).toEqual({ status: "saved" });

  const leads = (await (await request.get(`${mockOrigin}/__chat/leads`)).json()) as {
    email: string;
    source: string;
    name: string;
  }[];
  expect(leads.find((lead) => lead.email === input.email)).toMatchObject({
    source: "nexo",
    name: "Vera Visita",
  });

  const thread = await getThread(request);
  expect(thread.state.handoffDone).toBe(true);
  expect(thread.messages.at(-1)).toMatchObject({ author: "system", systemEvent: "handoff_done" });

  const down = await request.post("/api/chat/handoff", {
    data: { email: "down@example.com", consent: true },
  });
  expect(down.status()).toBe(503);
  expect(await visitorTokenHash(request)).not.toBeNull();
});

test("the stream follows the conversation: ready, thinking, message, takeover and offline", async ({
  context,
  page,
  request,
}) => {
  await page.goto("/es");
  const sent = await page.evaluate(async (token) => {
    const response = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "stream", locale: "es", turnstileToken: token }),
    });
    return response.status;
  }, goodTurnstile);
  expect(sent).toBe(200);
  const hash = await visitorTokenHash(context);
  if (!hash) throw new Error("no visitor cookie");

  await page.evaluate(() => {
    const events: { name: string; data: unknown }[] = [];
    Object.assign(window, { streamEvents: events });
    const source = new EventSource("/api/chat/stream");
    for (const name of ["ready", "message", "thinking", "takeover", "offline", "handoff"]) {
      source.addEventListener(name, (event) => {
        events.push({ name, data: JSON.parse((event as MessageEvent<string>).data) });
      });
    }
  });
  const names = () =>
    page.evaluate(() =>
      (window as unknown as { streamEvents: { name: string }[] }).streamEvents.map(
        (entry) => entry.name,
      ),
    );

  await expect.poll(names).toEqual(expect.arrayContaining(["ready", "message"]));
  await omen(request, hash, "online");
  await expect.poll(names).toContain("offline");
  await omen(request, hash, "reply", { body: "Respuesta de Nexo" });
  await expect.poll(names).toContain("thinking");
  await omen(request, hash, "takeover");
  await expect.poll(names).toContain("takeover");
  const events = await page.evaluate(
    () =>
      (
        window as unknown as {
          streamEvents: { name: string; data: { body?: string; author?: string } }[];
        }
      ).streamEvents,
  );
  const replies = events
    .filter((entry) => entry.name === "message")
    .map((entry) => entry.data.body);
  expect(replies).toEqual(expect.arrayContaining(["stream", "Respuesta de Nexo"]));
  expect(new Set(replies).size).toBe(replies.length);
});
