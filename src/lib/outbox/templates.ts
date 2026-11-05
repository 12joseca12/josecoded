import { z } from "zod";

import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { present } from "@/lib/contact/env";
import { fill } from "@/lib/notifications/time";
import type {
  EmailMessage,
  OutboxChannel,
  OutboxItem,
  RenderResult,
  TelegramMessage,
} from "@/types/outbox";

type Translate = (key: MessageKey) => string;
type Translators = (locale: Locale) => Promise<Translate>;

type Paragraph = { text: string } | { action: string; url: string };

const internalPath = z
  .string()
  .max(500)
  .regex(/^\/[^/\\]/);

const roles = ["admin", "closer", "freelance", "client"] as const;
const vias = ["hiring", "freelance", "project"] as const;
const sources = ["form", "nexo", "manual", "whatsapp", "radar"] as const;

const invitationSchema = z.object({
  path: internalPath,
  role: z.enum(roles),
  invited_by_name: z.string().nullish(),
  expires_at: z.string().nullish(),
});

const leadSchema = z.object({
  lead_id: z.uuid(),
  via: z.enum(vias),
  source: z.enum(sources),
  full_name: z.string().min(1).max(200),
  organization: z.string().max(200).nullish(),
});

const notificationSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(1000).nullish(),
  href: internalPath.nullish(),
});

const entities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => entities[char] ?? char);
}

function localeOf(payload: Record<string, unknown>): Locale {
  const value = payload.locale;
  return typeof value === "string" && isLocale(value) ? value : defaultLocale;
}

function formatDate(iso: string, locale: Locale): string | null {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Madrid" }).format(
    instant,
  );
}

function textOf(paragraphs: Paragraph[]): string {
  return paragraphs
    .map((paragraph) =>
      "text" in paragraph ? paragraph.text : `${paragraph.action}\n${paragraph.url}`,
    )
    .join("\n\n");
}

function htmlOf(paragraphs: Paragraph[]): string {
  return paragraphs
    .map((paragraph) => {
      if ("text" in paragraph)
        return `<p>${escapeHtml(paragraph.text).replaceAll("\n", "<br>")}</p>`;
      const url = escapeHtml(paragraph.url);
      return `<p>${escapeHtml(paragraph.action)}<br><a href="${url}">${url}</a></p>`;
    })
    .join("");
}

function asEmail(
  item: OutboxItem,
  subject: string,
  paragraphs: Paragraph[],
  signature: string,
): RenderResult {
  const all = [...paragraphs, { text: signature }];
  const message: EmailMessage = {
    channel: "email",
    to: item.recipient,
    subject,
    text: textOf(all),
    html: htmlOf(all),
  };
  return { ok: true, message };
}

function asTelegram(item: OutboxItem, paragraphs: Paragraph[]): RenderResult {
  const message: TelegramMessage = {
    channel: "telegram",
    chatId: item.recipient,
    text: textOf(paragraphs),
  };
  return { ok: true, message };
}

function link(origin: string, locale: Locale, path: string): string {
  return `${origin}/${locale}${path}`;
}

function unsupported(item: OutboxItem, allowed: readonly OutboxChannel[]): RenderResult | null {
  return allowed.includes(item.channel) ? null : { ok: false, reason: "channel_not_supported" };
}

export async function renderItem(
  item: OutboxItem,
  translators: Translators,
  origin: string,
): Promise<RenderResult> {
  const locale = localeOf(item.payload);
  const t = await translators(locale);
  const signature = t("outbox.signature");
  const invalid: RenderResult = { ok: false, reason: "payload_invalid" };

  switch (item.template) {
    case "invitation": {
      const refused = unsupported(item, ["email"]);
      if (refused) return refused;
      const parsed = invitationSchema.safeParse(item.payload);
      if (!parsed.success) return invalid;
      const inviter =
        present(parsed.data.invited_by_name ?? undefined) ?? t("outbox.invitation.unknownInviter");
      const expires = parsed.data.expires_at ? formatDate(parsed.data.expires_at, locale) : null;
      const paragraphs: Paragraph[] = [
        {
          text: fill(t("outbox.invitation.intro"), {
            inviter,
            role: t(`outbox.roles.${parsed.data.role}`),
          }),
        },
        { action: t("outbox.invitation.action"), url: link(origin, locale, parsed.data.path) },
        ...(expires ? [{ text: fill(t("outbox.invitation.expires"), { date: expires }) }] : []),
        { text: t("outbox.invitation.ignore") },
      ];
      return asEmail(
        item,
        fill(t("outbox.invitation.subject"), { inviter }),
        paragraphs,
        signature,
      );
    }
    case "lead_new": {
      const refused = unsupported(item, ["email"]);
      if (refused) return refused;
      const parsed = leadSchema.safeParse(item.payload);
      if (!parsed.success) return invalid;
      const lead = parsed.data;
      const organization = lead.organization?.trim();
      const paragraphs: Paragraph[] = [
        { text: fill(t("outbox.leadNew.intro"), { via: t(`outbox.vias.${lead.via}`) }) },
        {
          text: [
            fill(t("outbox.leadNew.name"), { name: lead.full_name }),
            ...(organization ? [fill(t("outbox.leadNew.organization"), { organization })] : []),
            fill(t("outbox.leadNew.source"), { source: t(`outbox.sources.${lead.source}`) }),
          ].join("\n"),
        },
        {
          action: t("outbox.leadNew.action"),
          url: link(origin, locale, `/admin/interesados/${lead.lead_id}`),
        },
      ];
      return asEmail(
        item,
        fill(t("outbox.leadNew.subject"), { name: lead.full_name }),
        paragraphs,
        signature,
      );
    }
    case "test": {
      const body: Paragraph[] = [{ text: t("outbox.test.body") }];
      if (item.channel === "telegram") return asTelegram(item, body);
      return asEmail(item, t("outbox.test.subject"), body, signature);
    }
    case "totp_reset": {
      const refused = unsupported(item, ["email"]);
      if (refused) return refused;
      return asEmail(
        item,
        t("outbox.totpReset.subject"),
        [
          { text: t("outbox.totpReset.intro") },
          { text: t("outbox.totpReset.next") },
          { text: t("outbox.totpReset.ignore") },
        ],
        signature,
      );
    }
    case "notification": {
      const parsed = notificationSchema.safeParse(item.payload);
      if (!parsed.success) return invalid;
      const { title, body, href } = parsed.data;
      const action: Paragraph[] = href
        ? [{ action: t("outbox.notification.action"), url: link(origin, locale, href) }]
        : [];
      const paragraphs: Paragraph[] = [...(body ? [{ text: body }] : []), ...action];
      if (item.channel === "telegram") return asTelegram(item, [{ text: title }, ...paragraphs]);
      return asEmail(item, title, paragraphs, signature);
    }
    default:
      return { ok: false, reason: "unknown_template" };
  }
}
