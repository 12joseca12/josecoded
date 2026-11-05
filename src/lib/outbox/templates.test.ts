import { describe, expect, it } from "vitest";

import { getTranslator } from "@/i18n/messages";
import type { OutboxItem } from "@/types/outbox";

import { renderItem } from "./templates";

const origin = "https://josecoded.com";

function item(overrides: Partial<OutboxItem>): OutboxItem {
  return {
    id: 1,
    channel: "email",
    recipient: "someone@example.com",
    template: "test",
    payload: {},
    attempts: 0,
    ...overrides,
  };
}

const render = (value: OutboxItem) => renderItem(value, getTranslator, origin);

function email(result: Awaited<ReturnType<typeof render>>) {
  if (!result.ok || result.message.channel !== "email") throw new Error("expected an email");
  return result.message;
}

function telegram(result: Awaited<ReturnType<typeof render>>) {
  if (!result.ok || result.message.channel !== "telegram") throw new Error("expected telegram");
  return result.message;
}

describe("invitation", () => {
  const payload = {
    path: "/invitacion/abc123",
    role: "closer",
    invited_by_name: "Jose Enrolled",
    expires_at: "2026-11-12T10:00:00+00:00",
    locale: "es",
  };

  it("sends the absolute link with the locale prefix", async () => {
    const message = email(await render(item({ template: "invitation", payload })));
    expect(message.to).toBe("someone@example.com");
    expect(message.subject).toBe("Jose Enrolled te invita a josecoded");
    expect(message.text).toContain("https://josecoded.com/es/invitacion/abc123");
    expect(message.text).toContain("como closer");
    expect(message.text).toContain("12 de noviembre de 2026");
    expect(message.html).toContain('<a href="https://josecoded.com/es/invitacion/abc123">');
  });

  it("follows the locale of the payload", async () => {
    const message = email(
      await render(item({ template: "invitation", payload: { ...payload, locale: "en" } })),
    );
    expect(message.subject).toBe("Jose Enrolled invites you to josecoded");
    expect(message.text).toContain("https://josecoded.com/en/invitacion/abc123");
  });

  it("names the inviter as Jose when the name is missing", async () => {
    const message = email(
      await render(
        item({ template: "invitation", payload: { ...payload, invited_by_name: null } }),
      ),
    );
    expect(message.subject).toBe("Jose te invita a josecoded");
  });

  it("refuses a link that is not a path of this site or a role that does not exist", async () => {
    for (const bad of [
      { path: "//evil.example/x" },
      { path: "https://evil.example" },
      { role: "boss" },
    ]) {
      expect(
        await render(item({ template: "invitation", payload: { ...payload, ...bad } })),
      ).toEqual({
        ok: false,
        reason: "payload_invalid",
      });
    }
  });

  it("is not available over Telegram", async () => {
    expect(
      await render(item({ channel: "telegram", recipient: "42", template: "invitation", payload })),
    ).toEqual({ ok: false, reason: "channel_not_supported" });
  });
});

describe("lead_new", () => {
  const payload = {
    lead_id: "30000000-0000-4000-8000-000000000001",
    via: "freelance",
    source: "form",
    full_name: "Ana <b>Prueba</b>",
    organization: "Acme",
    locale: "es",
  };

  it("summarises the lead and links to the panel", async () => {
    const message = email(await render(item({ template: "lead_new", payload })));
    expect(message.subject).toBe("Interesado nuevo: Ana <b>Prueba</b>");
    expect(message.text).toContain("por la vía de freelance");
    expect(message.text).toContain("Organización: Acme");
    expect(message.text).toContain("Origen: formulario");
    expect(message.text).toContain(
      "https://josecoded.com/es/admin/interesados/30000000-0000-4000-8000-000000000001",
    );
  });

  it("escapes the HTML body", async () => {
    const message = email(await render(item({ template: "lead_new", payload })));
    expect(message.html).not.toContain("<b>Prueba</b>");
    expect(message.html).toContain("Ana &lt;b&gt;Prueba&lt;/b&gt;");
  });

  it("leaves the organization line out when there is none", async () => {
    const message = email(
      await render(item({ template: "lead_new", payload: { ...payload, organization: null } })),
    );
    expect(message.text).not.toContain("Organización");
  });

  it("refuses a lead without an id", async () => {
    expect(
      await render(item({ template: "lead_new", payload: { ...payload, lead_id: "x" } })),
    ).toEqual({ ok: false, reason: "payload_invalid" });
  });
});

describe("test", () => {
  it("renders for email and for Telegram", async () => {
    const mail = email(await render(item({ template: "test" })));
    expect(mail.subject).toBe("Prueba de aviso");
    expect(mail.text).toContain("el canal funciona");
    const chat = telegram(await render(item({ channel: "telegram", recipient: "42" })));
    expect(chat.chatId).toBe("42");
    expect(chat.text).toContain("el canal funciona");
  });
});

describe("totp_reset", () => {
  it("tells the user to set the second step up again", async () => {
    const message = email(
      await render(item({ template: "totp_reset", payload: { locale: "es" } })),
    );
    expect(message.subject).toBe("Se ha restablecido tu verificación en dos pasos");
    expect(message.text).toContain("tendrás que configurarla de nuevo");
  });
});

describe("notification", () => {
  const payload = {
    event: "job_failed",
    title: "radar.scan",
    body: "Prueba: fallo de ejemplo",
    href: "/admin/sistema",
    locale: "es",
  };

  it("uses the title as subject and links to the panel", async () => {
    const message = email(await render(item({ template: "notification", payload })));
    expect(message.subject).toBe("radar.scan");
    expect(message.text).toContain("Prueba: fallo de ejemplo");
    expect(message.text).toContain("https://josecoded.com/es/admin/sistema");
  });

  it("renders a short Telegram text", async () => {
    const message = telegram(
      await render(
        item({ channel: "telegram", recipient: "42", template: "notification", payload }),
      ),
    );
    expect(message.text).toBe(
      "radar.scan\n\nPrueba: fallo de ejemplo\n\nAbrir en el panel:\nhttps://josecoded.com/es/admin/sistema",
    );
  });

  it("works without body and link", async () => {
    const message = telegram(
      await render(
        item({
          channel: "telegram",
          recipient: "42",
          template: "notification",
          payload: { title: "Hola", body: null, href: null },
        }),
      ),
    );
    expect(message.text).toBe("Hola");
  });

  it("refuses an empty title or an external link", async () => {
    expect(
      await render(item({ template: "notification", payload: { ...payload, title: "" } })),
    ).toEqual({ ok: false, reason: "payload_invalid" });
    expect(
      await render(
        item({ template: "notification", payload: { ...payload, href: "//x.example" } }),
      ),
    ).toEqual({ ok: false, reason: "payload_invalid" });
  });
});

describe("unknown template", () => {
  it("is reported", async () => {
    expect(await render(item({ template: "surprise" }))).toEqual({
      ok: false,
      reason: "unknown_template",
    });
  });
});
