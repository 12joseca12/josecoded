import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import {
  archivePriceSchema,
  extraRowSchema,
  movePriceSchema,
  offerRowSchema,
  planRowSchema,
  type PriceActionKind,
  type PriceActionResult,
  type PriceCatalog,
  type PriceCatalogResult,
  priceChangeRowSchema,
  type PriceHistoryEntry,
  type PriceItem,
  type PriceTable,
  rateRowSchema,
  savePriceSchema,
} from "@/types/prices";

const historyLimit = 400;

const tableOf: Record<PriceTable, string> = {
  offers: "offers",
  extras: "extras",
  rates: "rates",
  plans: "maintenance_plans",
};

const keyOf: Record<PriceTable, string> = {
  offers: "slug",
  extras: "slug",
  rates: "code",
  plans: "slug",
};

const priceColumnOf: Record<PriceTable, string> = {
  offers: "price",
  extras: "price",
  rates: "price",
  plans: "price_monthly",
};

export function historyKey(table: PriceTable, key: string): string {
  return `${table}:${key}`;
}

const historyTable: Record<string, PriceTable> = {
  offers: "offers",
  extras: "extras",
  rates: "rates",
  maintenance_plans: "plans",
};

function itemsFrom(table: PriceTable, data: unknown): PriceItem[] {
  if (table === "offers") {
    return z
      .array(offerRowSchema)
      .parse(data)
      .map((row) => ({
        table,
        key: row.slug,
        nameEs: row.name_es,
        nameEn: row.name_en,
        price: row.price,
        billing: null,
        weeks: { min: row.weeks_min, max: row.weeks_max },
        visible: row.visible,
        sort: row.sort,
        archived: row.archived_at !== null,
        updatedAt: row.updated_at,
      }));
  }
  if (table === "extras") {
    return z
      .array(extraRowSchema)
      .parse(data)
      .map((row) => ({
        table,
        key: row.slug,
        nameEs: row.name_es,
        nameEn: row.name_en,
        price: row.price,
        billing: row.billing,
        weeks: null,
        visible: row.visible,
        sort: row.sort,
        archived: row.archived_at !== null,
        updatedAt: row.updated_at,
      }));
  }
  if (table === "rates") {
    return z
      .array(rateRowSchema)
      .parse(data)
      .map((row) => ({
        table,
        key: row.code,
        nameEs: row.label_es,
        nameEn: row.label_en,
        price: row.price,
        billing: null,
        weeks: null,
        visible: row.visible,
        sort: row.sort,
        archived: false,
        updatedAt: row.updated_at,
      }));
  }
  return z
    .array(planRowSchema)
    .parse(data)
    .map((row) => ({
      table,
      key: row.slug,
      nameEs: row.name_es,
      nameEn: row.name_en,
      price: row.price_monthly,
      billing: "monthly",
      weeks: null,
      visible: row.visible,
      sort: row.sort,
      archived: row.archived_at !== null,
      updatedAt: row.updated_at,
    }));
}

const columnsOf: Record<PriceTable, string> = {
  offers:
    "slug, name_es, name_en, price, weeks_min, weeks_max, visible, sort, archived_at, updated_at",
  extras: "slug, name_es, name_en, price, billing, visible, sort, archived_at, updated_at",
  rates: "code, label_es, label_en, price, visible, sort, updated_at",
  plans: "slug, name_es, name_en, price_monthly, visible, sort, archived_at, updated_at",
};

function bySort(a: PriceItem, b: PriceItem): number {
  return a.sort - b.sort || a.key.localeCompare(b.key);
}

export async function fetchPriceCatalog(
  client: SupabaseClient<Database>,
): Promise<PriceCatalogResult> {
  try {
    const loose = client as unknown as SupabaseClient;
    const [offers, extras, rates, plans, changes, people] = await Promise.all([
      loose.from(tableOf.offers).select(columnsOf.offers),
      loose.from(tableOf.extras).select(columnsOf.extras),
      loose.from(tableOf.rates).select(columnsOf.rates),
      loose.from(tableOf.plans).select(columnsOf.plans),
      loose
        .from("price_changes")
        .select("id, table_name, row_id, field, before, after, changed_by, changed_at")
        .order("changed_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(historyLimit),
      loose.from("profiles").select("id, full_name"),
    ]);
    const failed = [offers, extras, rates, plans, changes, people].some((result) => result.error);
    if (failed) return { status: "error" };

    const names = new Map(
      z
        .array(z.object({ id: z.string(), full_name: z.string() }))
        .parse(people.data)
        .map((person) => [person.id, person.full_name]),
    );
    const history: Record<string, PriceHistoryEntry[]> = {};
    for (const row of z.array(priceChangeRowSchema).parse(changes.data)) {
      const table = historyTable[row.table_name];
      if (!table) continue;
      const bucket = (history[historyKey(table, row.row_id)] ??= []);
      bucket.push({
        id: row.id,
        field: row.field,
        before: row.before,
        after: row.after,
        by: row.changed_by ? (names.get(row.changed_by) ?? null) : null,
        at: row.changed_at,
      });
    }

    const catalog: PriceCatalog = {
      items: {
        offers: itemsFrom("offers", offers.data).sort(bySort),
        extras: itemsFrom("extras", extras.data).sort(bySort),
        rates: itemsFrom("rates", rates.data).sort(bySort),
        plans: itemsFrom("plans", plans.data).sort(bySort),
      },
      history,
    };
    return { status: "ok", catalog };
  } catch {
    return { status: "error" };
  }
}

interface PriceError {
  code?: string | null;
  message?: string | null;
}

export function mapPriceError(error: PriceError): PriceActionResult {
  if (error.code === "42501") return { status: "forbidden" };
  if (error.code === "23514") return { status: "invalid", field: "price" };
  return { status: "error" };
}

async function save(client: SupabaseClient, raw: unknown): Promise<PriceActionResult> {
  const parsed = savePriceSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: "price" };
  const input = parsed.data;
  const patch: Record<string, unknown> = { [priceColumnOf[input.table]]: input.price };
  if (input.table === "offers") {
    if (input.weeksMin === undefined || input.weeksMax === undefined) {
      return { status: "invalid", field: "weeks" };
    }
    if (input.weeksMin > input.weeksMax) return { status: "invalid", field: "weeks" };
    patch.weeks_min = input.weeksMin;
    patch.weeks_max = input.weeksMax;
  }
  if ((input.table === "extras" || input.table === "plans") && input.visible !== undefined) {
    patch.visible = input.visible;
  }
  const { data, error } = await client
    .from(tableOf[input.table])
    .update(patch)
    .eq(keyOf[input.table], input.key)
    .eq("updated_at", input.expectedUpdatedAt)
    .select(keyOf[input.table]);
  if (error) return mapPriceError(error);
  return Array.isArray(data) && data.length > 0 ? { status: "done" } : { status: "stale" };
}

async function archive(client: SupabaseClient, raw: unknown): Promise<PriceActionResult> {
  const parsed = archivePriceSchema.safeParse(raw);
  if (!parsed.success || parsed.data.table === "rates") return { status: "error" };
  const input = parsed.data;
  const { data, error } = await client
    .from(tableOf[input.table])
    .update({ archived_at: input.archived ? new Date().toISOString() : null })
    .eq(keyOf[input.table], input.key)
    .eq("updated_at", input.expectedUpdatedAt)
    .select(keyOf[input.table]);
  if (error) return mapPriceError(error);
  return Array.isArray(data) && data.length > 0 ? { status: "done" } : { status: "stale" };
}

const sortStep = 10;

async function move(client: SupabaseClient, raw: unknown): Promise<PriceActionResult> {
  const parsed = movePriceSchema.safeParse(raw);
  if (!parsed.success || parsed.data.table === "rates" || parsed.data.table === "offers") {
    return { status: "error" };
  }
  const { table, key, direction } = parsed.data;
  const { data, error } = await client
    .from(tableOf[table])
    .select(`${keyOf[table]}, sort`)
    .order("sort", { ascending: true })
    .order(keyOf[table], { ascending: true });
  if (error) return mapPriceError(error);
  const rows = z.array(z.object({ slug: z.string(), sort: z.number().int() })).safeParse(data);
  if (!rows.success) return { status: "error" };
  const order = rows.data.map((row) => row.slug);
  const from = order.indexOf(key);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0) return { status: "stale" };
  if (to < 0 || to >= order.length) return { status: "done" };
  const swapped = [...order];
  const moving = swapped[from];
  const other = swapped[to];
  if (moving === undefined || other === undefined) return { status: "error" };
  swapped[from] = other;
  swapped[to] = moving;
  const changes = swapped
    .map((slug, index) => ({ slug, sort: (index + 1) * sortStep }))
    .filter((entry) => rows.data.find((row) => row.slug === entry.slug)?.sort !== entry.sort);
  for (const entry of changes) {
    const result = await client
      .from(tableOf[table])
      .update({ sort: entry.sort })
      .eq(keyOf[table], entry.slug);
    if (result.error) return mapPriceError(result.error);
  }
  return { status: "done" };
}

export async function runPriceAction(
  client: SupabaseClient<Database>,
  kind: PriceActionKind,
  raw: unknown,
): Promise<PriceActionResult> {
  try {
    const loose = client as unknown as SupabaseClient;
    if (kind === "save") return await save(loose, raw);
    if (kind === "archive") return await archive(loose, raw);
    return await move(loose, raw);
  } catch {
    return { status: "error" };
  }
}
