import "@/lib/security/zod-jitless";

import { z } from "zod";

import { features } from "@/config/features";

export const settingGroups = [
  "sections",
  "maintenance",
  "availability",
  "nexo",
  "billing",
] as const;
export type SettingGroup = (typeof settingGroups)[number];

export const settingKinds = [
  "switch",
  "maintenance",
  "month",
  "date",
  "hours",
  "delay",
  "cadence",
  "vat",
] as const;
export type SettingKind = (typeof settingKinds)[number];

export const payoutCadences = ["per_payment", "weekly", "biweekly"] as const;

export interface MaintenanceValue {
  on: boolean;
  until?: string | null;
}

export type SettingValue = boolean | number | string | null | MaintenanceValue;

export interface SettingDefinition {
  key: string;
  group: SettingGroup;
  kind: SettingKind;
  fallback: SettingValue;
  wired: boolean;
}

export const settingDefinitions = [
  { key: "blog", group: "sections", kind: "switch", fallback: features.blog, wired: false },
  { key: "projects", group: "sections", kind: "switch", fallback: features.projects, wired: false },
  { key: "lab", group: "sections", kind: "switch", fallback: false, wired: false },
  { key: "public_chat", group: "sections", kind: "switch", fallback: features.chat, wired: false },
  { key: "search", group: "sections", kind: "switch", fallback: features.search, wired: false },
  { key: "show_prices", group: "sections", kind: "switch", fallback: true, wired: false },
  {
    key: "cv_download",
    group: "sections",
    kind: "switch",
    fallback: features.cvDownload,
    wired: false,
  },
  {
    key: "google_sign_in",
    group: "sections",
    kind: "switch",
    fallback: features.googleSignIn,
    wired: true,
  },
  {
    key: "maintenance",
    group: "maintenance",
    kind: "maintenance",
    fallback: { on: false },
    wired: false,
  },
  {
    key: "availability.next_project_month",
    group: "availability",
    kind: "month",
    fallback: null,
    wired: false,
  },
  {
    key: "availability.weekly_hours",
    group: "availability",
    kind: "hours",
    fallback: null,
    wired: false,
  },
  { key: "availability.from", group: "availability", kind: "date", fallback: null, wired: false },
  { key: "nexo.reply_delay_min", group: "nexo", kind: "delay", fallback: 10, wired: false },
  {
    key: "payout.default_cadence",
    group: "billing",
    kind: "cadence",
    fallback: "biweekly",
    wired: false,
  },
  { key: "billing.vat_rate", group: "billing", kind: "vat", fallback: 21, wired: false },
] as const satisfies readonly SettingDefinition[];

export type SettingKey = (typeof settingDefinitions)[number]["key"];

export const settingKeys = settingDefinitions.map((entry) => entry.key) as [
  SettingKey,
  ...SettingKey[],
];

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const datePattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const untilPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const maintenanceSchema = z.strictObject({
  on: z.boolean(),
  until: z.string().regex(untilPattern).nullable().optional(),
});

const schemas = {
  switch: z.boolean(),
  maintenance: maintenanceSchema,
  month: z.string().regex(monthPattern).nullable(),
  date: z.string().regex(datePattern).nullable(),
  hours: z.number().int().min(0).max(80).nullable(),
  delay: z.number().int().min(0).max(240),
  cadence: z.enum(payoutCadences),
  vat: z.number().min(0).max(100).multipleOf(0.01),
} as const;

const definitionByKey = new Map<string, SettingDefinition>(
  settingDefinitions.map((entry) => [entry.key, entry]),
);

export function definitionOf(key: string): SettingDefinition | null {
  return definitionByKey.get(key) ?? null;
}

export function parseSettingValue(key: string, value: unknown): SettingValue | undefined {
  const definition = definitionOf(key);
  if (!definition) return undefined;
  const parsed = schemas[definition.kind].safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export const saveSettingSchema = z.strictObject({
  key: z.enum(settingKeys),
  value: z.unknown(),
});

export interface SettingRowData {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface SettingView {
  key: SettingKey;
  group: SettingGroup;
  kind: SettingKind;
  value: SettingValue;
  wired: boolean;
  updatedAt: string | null;
}

export function buildSettingViews(rows: readonly SettingRowData[] | null): SettingView[] {
  const stored = new Map((rows ?? []).map((row) => [row.key, row]));
  return settingDefinitions.map((definition) => {
    const row = stored.get(definition.key);
    const parsed = row ? parseSettingValue(definition.key, row.value) : undefined;
    return {
      key: definition.key,
      group: definition.group,
      kind: definition.kind,
      value: parsed === undefined ? definition.fallback : parsed,
      wired: definition.wired,
      updatedAt: row && parsed !== undefined ? row.updated_at : null,
    };
  });
}

export const featureSettingKeys = {
  blog: "blog",
  chat: "public_chat",
  cvDownload: "cv_download",
  googleSignIn: "google_sign_in",
  projects: "projects",
  search: "search",
} as const satisfies Record<keyof typeof features, SettingKey>;

export type FeatureName = keyof typeof featureSettingKeys;

export function mergeFeatures(
  base: typeof features,
  rows: readonly { key: string; value: unknown }[] | null,
): typeof features {
  if (!rows) return base;
  const merged = { ...base };
  for (const name of Object.keys(featureSettingKeys) as FeatureName[]) {
    const row = rows.find((entry) => entry.key === featureSettingKeys[name]);
    if (row && typeof row.value === "boolean") merged[name] = row.value;
  }
  return merged;
}
