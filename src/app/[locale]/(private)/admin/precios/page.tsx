import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { PriceTable } from "@/components/admin/PriceTable/PriceTable";
import { PriceTabs } from "@/components/admin/PriceTabs/PriceTabs";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { formatLeadDate } from "@/lib/admin/leads";
import { fetchPriceCatalog, historyKey } from "@/lib/admin/prices";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type PriceCatalog,
  type PriceHistoryEntry,
  type PriceItem,
  type PriceRowView,
  type PriceTable as PriceTableName,
  type PriceTableLabels,
  priceTables,
} from "@/types/prices";

import styles from "../admin.module.css";
import { archivePrice, movePrice, savePrice } from "./actions";

interface PricesProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const key = (path: string) => `admin.prices.${path}` as MessageKey;

const tabSlug: Record<PriceTableName, string> = {
  offers: "niveles",
  extras: "extras",
  rates: "tarifas",
  plans: "mantenimiento",
};

function tabOf(raw: string | string[] | undefined): PriceTableName {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return priceTables.find((table) => tabSlug[table] === value) ?? "offers";
}

export async function generateMetadata({ params }: PricesProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t(key("meta.title")) };
}

type Translate = Awaited<ReturnType<typeof getTranslator>>;

function unitOf(item: PriceItem, t: Translate): string {
  if (item.table === "rates")
    return t(key(`units.${item.key === "hourly" ? "hourly" : "task_min"}`));
  if (item.table === "plans") return t(key("units.monthly"));
  return t(key(`units.${item.billing ?? "once"}`));
}

function detailOf(item: PriceItem, t: Translate): string {
  if (item.weeks) {
    return t("offersPage.compare.weeks")
      .replace("{min}", String(item.weeks.min))
      .replace("{max}", String(item.weeks.max));
  }
  if (item.table === "rates") {
    return t(key(`rateDetail.${item.key === "hourly" ? "hourly" : "task_min"}`));
  }
  if (item.table === "extras" && item.billing) return t(key(`billing.${item.billing}`));
  return "";
}

function buildRows(
  table: PriceTableName,
  catalog: PriceCatalog,
  locale: Locale,
  t: Translate,
): PriceRowView[] {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const fieldValue = (item: PriceItem, field: string, raw: string | null) => {
    if (field === "visible") return raw === "true" ? t(key("yes")) : t(key("no"));
    if (field === "archived_at")
      return raw === null ? t(key("noValue")) : formatLeadDate(raw, locale);
    if (raw === null) return t("services.price.review");
    return `${number.format(Number(raw))} ${unitOf(item, t)}`;
  };
  const describeChange = (item: PriceItem, entry: PriceHistoryEntry) => ({
    id: entry.id,
    text: `${t(key(`fields.${entry.field}`))}: ${fieldValue(item, entry.field, entry.before)} → ${fieldValue(item, entry.field, entry.after)}`,
    meta: `${entry.by ?? t(key("unknownAuthor"))} · ${formatLeadDate(entry.at, locale)}`,
  });
  return catalog.items[table].map((item) => ({
    item,
    name: locale === "en" ? item.nameEn : item.nameEs,
    priceText: item.price === null ? null : number.format(item.price),
    unit: unitOf(item, t),
    detail: detailOf(item, t),
    history: (catalog.history[historyKey(table, item.key)] ?? []).map((entry) =>
      describeChange(item, entry),
    ),
  }));
}

async function PricesSection({ locale, table }: { locale: Locale; table: PriceTableName }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchPriceCatalog(client);

  if (result.status === "error") {
    return (
      <LeadsError
        title={t(key("error.title"))}
        text={t(key("error.text"))}
        retryLabel={t(key("error.retry"))}
        loadingLabel={t(key("error.retrying"))}
      />
    );
  }
  const rows = buildRows(table, result.catalog, locale, t);
  if (rows.length === 0) {
    return (
      <EmptyState headingLevel={2} title={t(key("empty.title"))} text={t(key("empty.text"))} />
    );
  }

  const labels: PriceTableLabels = {
    region: t(key("region")),
    caption: t(key("caption")).replace("{tab}", t(key(`tabs.${table}`))),
    columns: {
      name: t(key("columns.name")),
      price: t(key("columns.price")),
      detail: t(key("columns.detail")),
      visible: t(key("columns.visible")),
      status: t(key("columns.status")),
      actions: t(key("columns.actions")),
    },
    review: t("services.price.review"),
    yes: t(key("yes")),
    no: t(key("no")),
    archived: t(key("archived")),
    active: t(key("active")),
    edit: t(key("edit")),
    moveUp: t(key("moveUp")),
    moveDown: t(key("moveDown")),
    archive: t(key("archive")),
    restore: t(key("restore")),
    confirmArchive: t(key("confirmArchive")),
    confirmArchiveYes: t(key("confirmArchiveYes")),
    history: t(key("history")),
    historyEmpty: t(key("historyEmpty")),
    sheet: {
      title: t(key("sheet.title")),
      close: t(key("sheet.close")),
      priceLabel: t(key("sheet.priceLabel")),
      priceHint: t(key("sheet.priceHint")),
      weeksMinLabel: t(key("sheet.weeksMinLabel")),
      weeksMaxLabel: t(key("sheet.weeksMaxLabel")),
      visibleLabel: t(key("sheet.visibleLabel")),
      save: t(key("sheet.save")),
      saving: t(key("sheet.saving")),
      cancel: t(key("sheet.cancel")),
    },
    actions: {
      done: {
        save: t(key("actions.done.save")),
        archive: t(key("actions.done.archive")),
        restore: t(key("actions.done.restore")),
        move: t(key("actions.done.move")),
      },
      errors: {
        price: t(key("actions.errors.price")),
        weeks: t(key("actions.errors.weeks")),
        stale: t(key("actions.errors.stale")),
        forbidden: t(key("actions.errors.forbidden")),
        error: t(key("actions.errors.error")),
      },
    },
  };

  return (
    <PriceTable
      rows={rows}
      labels={labels}
      save={savePrice.bind(null, locale)}
      archive={archivePrice.bind(null, locale)}
      move={movePrice.bind(null, locale)}
    />
  );
}

export default async function PricesPage({ params, searchParams }: PricesProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  const table = tabOf(query.tab);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t(key("title"))}
        </Heading>
        <p className={styles.lead}>{t(key("lead"))}</p>
      </header>
      <PriceTabs
        label={t(key("tabsLabel"))}
        currentId={table}
        items={priceTables.map((id) => ({
          id,
          label: t(key(`tabs.${id}`)),
          href: `/${locale}/admin/precios?tab=${tabSlug[id]}`,
        }))}
      />
      <Suspense
        key={table}
        fallback={
          <LoadingRegion
            loading
            label={t(key("loading"))}
            fallback={
              <div className={styles.skeleton}>
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
              </div>
            }
          >
            {null}
          </LoadingRegion>
        }
      >
        <PricesSection locale={locale} table={table} />
      </Suspense>
    </>
  );
}
