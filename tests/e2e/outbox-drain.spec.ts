import { readFileSync } from "node:fs";

import { type APIRequestContext, expect, test } from "@playwright/test";

import { mockOrigin as mock, signInAdmin, type Tag, withTag } from "./support/staff";

interface DrainMessages {
  admin: {
    notifications: {
      telegram: { unlinked: string };
      test: { send: Record<"email", string>; done: Record<"email", string> };
    };
  };
}

const es = (JSON.parse(readFileSync("messages/es.json", "utf8")) as DrainMessages).admin
  .notifications;
const live = process.env.E2E_OUTBOX_DRAIN === "on";
const cronSecret = "test-cron-secret";
const webhookSecret = "test-telegram-webhook-secret";
const adminId = "00000000-0000-4000-8000-0000000000a2";

interface Row {
  id: number;
  channel: string;
  recipient: string;
  template: string;
  status: string;
  attempts: number;
  last_error: string | null;
}

interface Fake {
  kind: "email" | "telegram";
  to: string;
  from?: string;
  subject?: string;
  text: string;
  html?: string;
}

interface Seed {
  channel: "email" | "telegram";
  recipient: string;
  template: string;
  payload?: Record<string, unknown>;
}

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.79" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

test.afterEach(async ({ request }) => {
  await request.post(`${mock}/__auth/outbox-clear?tag=${tag.value}`);
});

async function seed(request: APIRequestContext, items: Seed[]) {
  const response = await request.post(`${mock}/__auth/outbox-seed?tag=${tag.value}`, {
    data: items,
  });
  return (await response.json()) as Row[];
}

async function rows(request: APIRequestContext): Promise<Row[]> {
  const response = await request.get(`${mock}/__auth/outbox?tag=${tag.value}`);
  return (await response.json()) as Row[];
}

async function fakes(request: APIRequestContext): Promise<Fake[]> {
  const response = await request.get(`${mock}/__auth/fakes?tag=${tag.value}`);
  return (await response.json()) as Fake[];
}

function drain(request: APIRequestContext, secret: string | null = cronSecret) {
  return request.post("/api/cron/outbox", {
    headers: secret === null ? {} : { "x-cron-secret": secret },
  });
}

function webhook(request: APIRequestContext, body: unknown, secret: string | null = webhookSecret) {
  return request.post("/api/telegram/webhook", {
    headers: secret === null ? {} : { "x-telegram-bot-api-secret-token": secret },
    data: body,
  });
}

function start(text: string, chatId = 9100, type = "private") {
  return { update_id: 1, message: { message_id: 1, text, chat: { id: chatId, type } } };
}

async function newCode(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${mock}/__auth/telegram-code?tag=${tag.value}`, {
    data: { userId: adminId },
  });
  return ((await response.json()) as { code: string }).code;
}

const mailbox = (name: string) => `${name}+${tag.value}@example.com`;

test.describe("sending off", () => {
  test.skip(live, "needs the default environment");

  test("the cron route refuses a missing or wrong secret and any other method", async ({
    request,
  }) => {
    expect((await drain(request, null)).status()).toBe(401);
    expect((await drain(request, "wrong-secret")).status()).toBe(401);
    expect(
      (
        await request.get("/api/cron/outbox", { headers: { "x-cron-secret": cronSecret } })
      ).status(),
    ).toBe(405);
  });

  test("with a good secret it answers that sending is off and sends nothing", async ({
    request,
  }) => {
    await seed(request, [{ channel: "email", recipient: mailbox("ok"), template: "test" }]);
    const response = await drain(request);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: "off" });
    expect((await rows(request)).map((row) => row.status)).toEqual(["queued"]);
    expect(await fakes(request)).toEqual([]);
  });

  test("a test from the page stays queued while sending is off", async ({ page, request }) => {
    await signInAdmin(page, tag, "?next=%2Fes%2Fadmin%2Fnotificaciones");
    await page.getByRole("button", { name: es.test.send.email }).click();
    await expect(page.getByRole("status").filter({ hasText: es.test.done.email })).toBeVisible();
    await drain(request);
    expect((await rows(request)).map((row) => row.status)).toEqual(["queued"]);
    expect(await fakes(request)).toEqual([]);
  });

  test("the webhook refuses a missing or wrong secret", async ({ request }) => {
    expect((await webhook(request, start("/start AB23CD"), null)).status()).toBe(401);
    expect((await webhook(request, start("/start AB23CD"), "nope")).status()).toBe(401);
  });

  test("the webhook links a chat from /start without replying while sending is off", async ({
    page,
    request,
  }) => {
    const code = await newCode(request);
    const response = await webhook(request, start(`/start ${code}`));
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: "linked" });
    expect(await fakes(request)).toEqual([]);

    await signInAdmin(page, tag, "?next=%2Fes%2Fadmin%2Fnotificaciones");
    await expect(page.getByText(/^Vinculado el /)).toBeVisible();
    await expect(page.getByText(es.telegram.unlinked)).toHaveCount(0);
  });

  test("the webhook ignores what is not a /start and reports a bad code", async ({ request }) => {
    expect(await (await webhook(request, start("hola"))).json()).toEqual({ status: "ignored" });
    expect(await (await webhook(request, start("/start AB23CD", -5, "group"))).json()).toEqual({
      status: "ignored",
    });
    expect(await (await webhook(request, start("/start"))).json()).toEqual({ status: "no_code" });
    expect(await (await webhook(request, start("/start ZZZZZZ"))).json()).toEqual({
      status: "invalid",
    });
    expect(await (await webhook(request, start("/start 12"))).json()).toEqual({
      status: "invalid",
    });
    const malformed = await request.post("/api/telegram/webhook", {
      headers: { "x-telegram-bot-api-secret-token": webhookSecret, "content-type": "text/plain" },
      data: "{not json",
    });
    expect(await malformed.json()).toEqual({ status: "ignored" });
  });
});

test.describe("sending on", () => {
  test.skip(!live, "needs E2E_OUTBOX_DRAIN=on");

  test("the cron route still refuses a missing secret", async ({ request }) => {
    expect((await drain(request, null)).status()).toBe(401);
  });

  test("it sends a test email and a test Telegram message and marks both as sent", async ({
    request,
  }) => {
    await seed(request, [
      { channel: "email", recipient: mailbox("ok"), template: "test", payload: { locale: "es" } },
      { channel: "telegram", recipient: "777", template: "test" },
    ]);
    const response = await drain(request);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({
      status: "done",
      claimed: 2,
      sent: 2,
      retried: 0,
      failed: 0,
    });
    expect((await rows(request)).map((row) => row.status)).toEqual(["sent", "sent"]);
    const sent = await fakes(request);
    const email = sent.find((entry) => entry.kind === "email");
    expect(email).toMatchObject({ to: mailbox("ok"), subject: "Prueba de aviso" });
    expect(email?.from).toContain("avisos@");
    expect(sent.find((entry) => entry.kind === "telegram")).toMatchObject({
      to: "777",
    });
    expect(sent.find((entry) => entry.kind === "telegram")?.text).toContain("el canal funciona");
  });

  test("it renders the invitation, new lead, TOTP reset and notification templates", async ({
    request,
  }) => {
    await seed(request, [
      {
        channel: "email",
        recipient: mailbox("invitee"),
        template: "invitation",
        payload: {
          path: "/invitacion/tok123",
          role: "closer",
          invited_by_name: "Jose Enrolled",
          expires_at: "2026-11-12T10:00:00+00:00",
          locale: "es",
        },
      },
      {
        channel: "email",
        recipient: mailbox("hola"),
        template: "lead_new",
        payload: {
          lead_id: "30000000-0000-4000-8000-000000000001",
          via: "freelance",
          source: "form",
          full_name: "Ana Prueba",
          organization: null,
        },
      },
      {
        channel: "email",
        recipient: mailbox("reset"),
        template: "totp_reset",
        payload: { locale: "es" },
      },
      {
        channel: "email",
        recipient: mailbox("notify"),
        template: "notification",
        payload: { title: "radar.scan", body: "Fallo de ejemplo", href: "/admin/sistema" },
      },
    ]);
    expect(await (await drain(request)).json()).toMatchObject({ claimed: 4, sent: 4 });
    const sent = await fakes(request);
    const by = (name: string) => sent.find((entry) => entry.to === mailbox(name));
    expect(by("invitee")?.subject).toBe("Jose Enrolled te invita a josecoded");
    expect(by("invitee")?.text).toMatch(/\/es\/invitacion\/tok123/);
    expect(by("invitee")?.html).toContain('<a href="http');
    expect(by("hola")?.subject).toBe("Interesado nuevo: Ana Prueba");
    expect(by("hola")?.text).toMatch(
      /\/es\/admin\/interesados\/30000000-0000-4000-8000-000000000001/,
    );
    expect(by("reset")?.subject).toBe("Se ha restablecido tu verificación en dos pasos");
    expect(by("notify")?.subject).toBe("radar.scan");
    expect(by("notify")?.text).toMatch(/\/es\/admin\/sistema/);
  });

  test("a transient provider error is retried in the same run", async ({ request }) => {
    await seed(request, [{ channel: "email", recipient: mailbox("flaky"), template: "test" }]);
    expect(await (await drain(request)).json()).toMatchObject({ sent: 1, retried: 0, failed: 0 });
    const [row] = await rows(request);
    expect(row).toMatchObject({ status: "sent", attempts: 0 });
    expect(await fakes(request)).toHaveLength(1);
  });

  test("a permanent error is retried on each run up to five attempts and then fails", async ({
    request,
  }) => {
    await seed(request, [{ channel: "email", recipient: mailbox("bounce"), template: "test" }]);
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      expect(await (await drain(request)).json()).toMatchObject({
        claimed: 1,
        sent: 0,
        retried: 1,
        failed: 0,
      });
      const [row] = await rows(request);
      expect(row).toMatchObject({ status: "queued", attempts: attempt });
      expect(row?.last_error).toBe("resend_422: Invalid `to` field");
    }
    expect(await (await drain(request)).json()).toMatchObject({
      claimed: 1,
      retried: 0,
      failed: 1,
    });
    expect((await rows(request))[0]).toMatchObject({ status: "failed", attempts: 5 });
    expect(await (await drain(request)).json()).toMatchObject({ claimed: 0 });
    expect(await fakes(request)).toEqual([]);
  });

  test("Telegram: a blocked bot is a failed attempt and a 429 waits for retry_after", async ({
    request,
  }) => {
    await seed(request, [
      { channel: "telegram", recipient: "403000", template: "test" },
      { channel: "telegram", recipient: "429000", template: "test" },
    ]);
    expect(await (await drain(request)).json()).toMatchObject({ claimed: 2, sent: 1, retried: 1 });
    const [blocked, limited] = await rows(request);
    expect(blocked).toMatchObject({ status: "queued", attempts: 1 });
    expect(blocked?.last_error).toBe("telegram_403: Forbidden: bot was blocked by the user");
    expect(limited).toMatchObject({ status: "sent", attempts: 0 });
  });

  test("a payload that cannot be rendered is marked without reaching a provider", async ({
    request,
  }) => {
    await seed(request, [
      {
        channel: "email",
        recipient: mailbox("bad"),
        template: "invitation",
        payload: { path: "//evil.example", role: "closer" },
      },
      { channel: "email", recipient: mailbox("odd"), template: "surprise" },
    ]);
    expect(await (await drain(request)).json()).toMatchObject({ claimed: 2, sent: 0, retried: 2 });
    const [bad, odd] = await rows(request);
    expect(bad?.last_error).toBe("payload_invalid");
    expect(odd?.last_error).toBe("unknown_template");
    expect(await fakes(request)).toEqual([]);
  });

  test("a test sent from the page reaches the fake mailbox once the cron runs", async ({
    page,
    request,
  }) => {
    await signInAdmin(page, tag, "?next=%2Fes%2Fadmin%2Fnotificaciones");
    await page.getByRole("button", { name: es.test.send.email }).click();
    await expect(page.getByRole("status").filter({ hasText: es.test.done.email })).toBeVisible();
    expect(await (await drain(request)).json()).toMatchObject({ claimed: 1, sent: 1 });
    const [mail] = await fakes(request);
    expect(mail).toMatchObject({ kind: "email", subject: "Prueba de aviso" });
    expect(mail?.to).toContain(`+${tag.value}@`);
  });

  test("the webhook links a chat and answers in Telegram", async ({ page, request }) => {
    const code = await newCode(request);
    expect(await (await webhook(request, start(`/start ${code}`, 9101))).json()).toEqual({
      status: "linked",
    });
    let sent = await fakes(request);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ kind: "telegram", to: "9101" });
    expect(sent[0]?.text).toContain("Telegram vinculado");

    expect(await (await webhook(request, start(`/start ${code}`, 9101))).json()).toEqual({
      status: "invalid",
    });
    sent = await fakes(request);
    expect(sent[1]?.text).toContain("no es válido");

    await signInAdmin(page, tag, "?next=%2Fes%2Fadmin%2Fnotificaciones");
    await expect(page.getByText(/^Vinculado el /)).toBeVisible();
  });

  test("a chat already linked to another account is reported", async ({ request }) => {
    const code = await newCode(request);
    await webhook(request, start(`/start ${code}`, 9102));
    const second = await request.post(`${mock}/__auth/telegram-code?tag=${tag.value}`, {
      data: { userId: "00000000-0000-4000-8000-0000000000c1" },
    });
    const otherCode = ((await second.json()) as { code: string }).code;
    expect(await (await webhook(request, start(`/start ${otherCode}`, 9102))).json()).toEqual({
      status: "taken",
    });
  });
});
