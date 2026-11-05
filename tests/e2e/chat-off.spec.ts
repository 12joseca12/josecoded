import { expect, test } from "@playwright/test";

test("while public_chat is off every chat route answers 404", async ({ request, page }) => {
  const send = await request.post("/api/chat/send", {
    data: { body: "hola", locale: "es", turnstileToken: "mock-token:chat" },
  });
  expect(send.status()).toBe(404);
  expect(
    (
      await request.post("/api/chat/handoff", { data: { email: "a@b.es", consent: true } })
    ).status(),
  ).toBe(404);
  expect((await request.get("/api/chat/thread")).status()).toBe(404);
  expect((await request.get("/api/chat/stream")).status()).toBe(404);
  const response = await page.goto("/es/chat");
  expect(response?.status()).toBe(404);
});
