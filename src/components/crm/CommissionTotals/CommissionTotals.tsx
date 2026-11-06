import Link from "next/link";

import { formatCents } from "@/lib/money";
import {
  type CommissionFilter,
  commissionFilters,
  type CommissionTotalsLabels,
  type CommissionTotalsValue,
} from "@/types/commissions";

import styles from "./CommissionTotals.module.css";

interface CommissionTotalsProps {
  totals: CommissionTotalsValue;
  active: CommissionFilter | null;
  hrefs: Record<CommissionFilter | "all", string>;
  locale: string;
  labels: CommissionTotalsLabels;
}

export function CommissionTotals({ totals, active, hrefs, locale, labels }: CommissionTotalsProps) {
  return (
    <nav aria-label={labels.label}>
      <ul className={styles.list}>
        <li>
          <Link
            className={styles.card}
            href={hrefs.all}
            aria-current={active === null ? "page" : undefined}
            scroll={false}
          >
            <span className={styles.name}>{labels.all}</span>
          </Link>
        </li>
        {commissionFilters.map((filter) => (
          <li key={filter}>
            <Link
              className={styles.card}
              href={hrefs[filter]}
              aria-current={active === filter ? "page" : undefined}
              scroll={false}
            >
              <span className={styles.name}>{labels[filter]}</span>
              <span
                className={styles.amount}
                data-negative={totals[filter] < 0 ? "true" : undefined}
              >
                {formatCents(totals[filter], locale)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
