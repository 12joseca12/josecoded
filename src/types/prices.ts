import "@/lib/security/zod-jitless";

import { z } from "zod";

export const priceTables = ["offers", "extras", "rates", "plans"] as const;
export type PriceTable = (typeof priceTables)[number];
export const priceTableSchema = z.enum(priceTables);

export const priceBillings = ["once", "monthly", "yearly", "per_unit"] as const;
export type PriceBilling = (typeof priceBillings)[number];

export const priceChangeFields = ["price", "price_monthly", "visible", "archived_at"] as const;

const timestamp = z.string().min(1);
const money = z.number().min(0).lt(10_000_000).nullable();

export const offerRowSchema = z.object({
  slug: z.string(),
  name_es: z.string(),
  name_en: z.string(),
  price: money,
  weeks_min: z.number().int(),
  weeks_max: z.number().int(),
  visible: z.boolean(),
  sort: z.number().int(),
  archived_at: z.string().nullable(),
  updated_at: timestamp,
});

export const extraRowSchema = z.object({
  slug: z.string(),
  name_es: z.string(),
  name_en: z.string(),
  price: money,
  billing: z.enum(priceBillings),
  visible: z.boolean(),
  sort: z.number().int(),
  archived_at: z.string().nullable(),
  updated_at: timestamp,
});

export const rateRowSchema = z.object({
  code: z.string(),
  label_es: z.string(),
  label_en: z.string(),
  price: money,
  visible: z.boolean(),
  sort: z.number().int(),
  updated_at: timestamp,
});

export const planRowSchema = z.object({
  slug: z.string(),
  name_es: z.string(),
  name_en: z.string(),
  price_monthly: money,
  visible: z.boolean(),
  sort: z.number().int(),
  archived_at: z.string().nullable(),
  updated_at: timestamp,
});

export const priceChangeRowSchema = z.object({
  id: z.number().int(),
  table_name: z.string(),
  row_id: z.string(),
  field: z.string(),
  before: z.string().nullable(),
  after: z.string().nullable(),
  changed_by: z.string().nullable(),
  changed_at: timestamp,
});

export type PriceChangeRow = z.infer<typeof priceChangeRowSchema>;

export interface PriceItem {
  table: PriceTable;
  key: string;
  nameEs: string;
  nameEn: string;
  price: number | null;
  billing: PriceBilling | null;
  weeks: { min: number; max: number } | null;
  visible: boolean;
  sort: number;
  archived: boolean;
  updatedAt: string;
}

export interface PriceHistoryEntry {
  id: number;
  field: string;
  before: string | null;
  after: string | null;
  by: string | null;
  at: string;
}

export interface PriceCatalog {
  items: Record<PriceTable, PriceItem[]>;
  history: Record<string, PriceHistoryEntry[]>;
}

export type PriceCatalogResult = { status: "ok"; catalog: PriceCatalog } | { status: "error" };

export const priceInputSchema = z.union([
  z.literal("").transform(() => null),
  z
    .string()
    .trim()
    .regex(/^\d{1,7}([.,]\d{1,2})?$/)
    .transform((value) => Number(value.replace(",", "."))),
]);

const itemRef = {
  table: priceTableSchema,
  key: z.string().min(1).max(40),
  expectedUpdatedAt: z.string().min(1).max(64),
};

export const savePriceSchema = z.strictObject({
  ...itemRef,
  price: priceInputSchema,
  weeksMin: z.number().int().min(1).max(104).optional(),
  weeksMax: z.number().int().min(1).max(104).optional(),
  visible: z.boolean().optional(),
});

export const archivePriceSchema = z.strictObject({
  ...itemRef,
  archived: z.boolean(),
});

export const movePriceSchema = z.strictObject({
  table: priceTableSchema,
  key: z.string().min(1).max(40),
  direction: z.enum(["up", "down"]),
});

export type PriceActionKind = "save" | "archive" | "move";

export type PriceActionResult =
  | { status: "done" }
  | { status: "invalid"; field: "price" | "weeks" }
  | { status: "stale" }
  | { status: "forbidden" }
  | { status: "error" };

export type PriceActionHandler = (raw: unknown) => Promise<PriceActionResult>;

export interface PriceActionLabels {
  done: { save: string; archive: string; restore: string; move: string };
  errors: { price: string; weeks: string; stale: string; forbidden: string; error: string };
}

export interface PriceSheetLabels {
  title: string;
  close: string;
  priceLabel: string;
  priceHint: string;
  weeksMinLabel: string;
  weeksMaxLabel: string;
  visibleLabel: string;
  save: string;
  saving: string;
  cancel: string;
}

export interface PriceTableLabels {
  region: string;
  caption: string;
  columns: {
    name: string;
    price: string;
    detail: string;
    visible: string;
    status: string;
    actions: string;
  };
  review: string;
  yes: string;
  no: string;
  archived: string;
  active: string;
  edit: string;
  moveUp: string;
  moveDown: string;
  archive: string;
  restore: string;
  confirmArchive: string;
  confirmArchiveYes: string;
  history: string;
  historyEmpty: string;
  sheet: PriceSheetLabels;
  actions: PriceActionLabels;
}

export interface PriceRowView {
  item: PriceItem;
  name: string;
  priceText: string | null;
  unit: string;
  detail: string;
  history: { id: number; text: string; meta: string }[];
}
