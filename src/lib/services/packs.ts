import { z } from "zod";

import type { MessageKey } from "@/i18n/keys.generated";

export const packSlugs = ["app-movil", "web-negocio", "web-y-app"] as const;
export type PackSlug = (typeof packSlugs)[number];

export const packStatuses = ["provisional", "final"] as const;

export const packSchema = z.strictObject({
  slug: z.enum(packSlugs),
  status: z.enum(packStatuses),
  from: z.string().min(1),
});

export const packsSchema = z
  .array(packSchema)
  .min(1)
  .refine((list) => new Set(list.map((pack) => pack.slug)).size === list.length, {
    message: "pack slugs must be unique",
  });

export type Pack = z.infer<typeof packSchema>;

export interface PackCopyKeys {
  name: MessageKey;
  text: MessageKey;
  bullets: readonly [MessageKey, MessageKey, MessageKey];
}

export const packCopyKeys: Record<PackSlug, PackCopyKeys> = {
  "app-movil": {
    name: "packsPage.items.app.name",
    text: "packsPage.items.app.text",
    bullets: ["packsPage.items.app.a", "packsPage.items.app.b", "packsPage.items.app.c"],
  },
  "web-negocio": {
    name: "packsPage.items.web.name",
    text: "packsPage.items.web.text",
    bullets: ["packsPage.items.web.a", "packsPage.items.web.b", "packsPage.items.web.c"],
  },
  "web-y-app": {
    name: "packsPage.items.both.name",
    text: "packsPage.items.both.text",
    bullets: ["packsPage.items.both.a", "packsPage.items.both.b", "packsPage.items.both.c"],
  },
};

export const packs: readonly Pack[] = packsSchema.parse([
  { slug: "app-movil", status: "provisional", from: "000" },
  { slug: "web-negocio", status: "provisional", from: "000" },
  { slug: "web-y-app", status: "provisional", from: "000" },
]);

export function isPackProvisional(pack: Pack): boolean {
  return pack.status === "provisional";
}

export function hasProvisionalPacks(list: readonly Pack[]): boolean {
  return list.some(isPackProvisional);
}

export function publicPacks(list: readonly Pack[]): Pack[] {
  return list.filter((pack) => !isPackProvisional(pack));
}
