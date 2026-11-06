import { AddItemSheet } from "@/components/admin/AddItemSheet/AddItemSheet";
import { FeeItemTable } from "@/components/admin/FeeItemTable/FeeItemTable";
import { type FeeDraft, FeeSheet } from "@/components/admin/FeeSheet/FeeSheet";
import { FeeTotals } from "@/components/admin/FeeTotals/FeeTotals";
import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import { formatCents, fromCents } from "@/lib/money";
import type { FeeHandler, FeeItem, FeePanelLabels, FeeSummary } from "@/types/admin-project-fee";

import styles from "./FeePanel.module.css";

interface FeePanelProps {
  projectId: string;
  freelanceId: string | null;
  fee: FeeSummary | null;
  items: FeeItem[];
  locale: string;
  labels: FeePanelLabels;
  handlers: {
    save: FeeHandler;
    add: FeeHandler;
    approve: FeeHandler;
    reject: FeeHandler;
    remove: FeeHandler;
  };
}

function plain(cents: number | null): string {
  return cents === null ? "" : String(fromCents(cents)).replace(".", ",");
}

function draftOf(fee: FeeSummary | null): FeeDraft {
  return {
    mode: fee?.mode ?? "hourly",
    amount: plain(fee?.amount ?? null),
    hourlyRate: plain(fee?.hourly_rate ?? null),
    hoursCap: fee?.hours_cap == null ? "" : String(fee.hours_cap).replace(".", ","),
    note: "",
  };
}

export function FeePanel({
  projectId,
  freelanceId,
  fee,
  items,
  locale,
  labels,
  handlers,
}: FeePanelProps) {
  if (freelanceId === null) return <p>{labels.noFreelance}</p>;

  const live = items.filter((item) => item.status !== "rejected");
  const remaining =
    fee?.mode === "fixed" && fee.amount !== null
      ? formatCents(fee.amount - live.reduce((sum, item) => sum + item.amount, 0), locale)
      : null;
  const summary =
    fee === null
      ? labels.noFee
      : labels.summary[fee.mode]
          .replace("{amount}", fee.amount === null ? "" : formatCents(fee.amount, locale))
          .replace("{rate}", fee.hourly_rate === null ? "" : formatCents(fee.hourly_rate, locale)) +
        (fee.mode === "hourly" && fee.hours_cap !== null
          ? ` ${labels.summaryCap.replace("{hours}", String(fee.hours_cap))}`
          : "");

  return (
    <section className={styles.panel} aria-label={labels.title}>
      <div className={styles.head}>
        <Heading level={2} size="h4">
          {labels.title}
        </Heading>
        <div className={styles.tools}>
          <FeeSheet
            projectId={projectId}
            initial={draftOf(fee)}
            existing={fee !== null}
            modeLocked={live.length > 0}
            labels={labels.sheet}
            save={handlers.save}
          />
          {fee !== null && fee.mode !== "hourly" ? (
            <AddItemSheet
              feeId={fee.fee_id}
              remaining={remaining}
              labels={labels.add}
              add={handlers.add}
            />
          ) : null}
          {fee !== null ? (
            <Button
              variant="quiet"
              size="sm"
              href={`/${locale}/admin/liquidaciones?beneficiario=${freelanceId}`}
            >
              {labels.settle}
            </Button>
          ) : null}
        </div>
      </div>
      <p className={styles.summary}>{summary}</p>
      {fee === null ? null : (
        <>
          <FeeTotals fee={fee} locale={locale} labels={labels.totals} />
          <FeeItemTable
            items={items}
            freelanceId={freelanceId}
            locale={locale}
            labels={labels.table}
            handlers={handlers}
          />
        </>
      )}
    </section>
  );
}
