import { formatCents } from "@/lib/money";
import type { FeeSummary, FeeTotalsLabels } from "@/types/admin-project-fee";

import styles from "./FeeTotals.module.css";

interface FeeTotalsProps {
  fee: FeeSummary;
  locale: string;
  labels: FeeTotalsLabels;
}

export function FeeTotals({ fee, locale, labels }: FeeTotalsProps) {
  const cells: [string, string][] = [
    [
      labels.agreed,
      fee.agreed_total === null ? labels.none : formatCents(fee.agreed_total, locale),
    ],
    [labels.pending, formatCents(fee.pending_amount, locale)],
    [labels.delivered, formatCents(fee.delivered_amount, locale)],
    [labels.approved, formatCents(fee.approved_unpaid_amount, locale)],
    [labels.paid, formatCents(fee.paid_amount, locale)],
  ];
  return (
    <dl className={styles.totals} aria-label={labels.region}>
      {cells.map(([term, value]) => (
        <div key={term} className={styles.cell}>
          <dt className={styles.term}>{term}</dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
