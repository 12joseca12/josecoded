import {
  FeeItemTable,
  type FeeItemTableLabels,
} from "@/components/freelance/FeeItemTable/FeeItemTable";
import { Heading } from "@/components/ui/Heading/Heading";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents, formatRate } from "@/lib/money";
import type { FeeItem, FreelancePayout } from "@/types/freelance-fees";

import styles from "./PayoutStatement.module.css";

export interface PayoutStatementLabels {
  title: string;
  notInvoice: string;
  beneficiary: string;
  period: string;
  range: string;
  status: string;
  statuses: Record<FreelancePayout["status"], string>;
  issuedAt: string;
  paidAt: string;
  reference: string;
  note: string;
  itemsTitle: string;
  total: string;
  withholding: string;
  net: string;
  items: FeeItemTableLabels;
}

interface PayoutStatementProps {
  payout: FreelancePayout;
  items: FeeItem[];
  projectNames: Record<string, string>;
  beneficiary: string;
  locale: string;
  labels: PayoutStatementLabels;
}

export function PayoutStatement({
  payout,
  items,
  projectNames,
  beneficiary,
  locale,
  labels,
}: PayoutStatementProps) {
  const range = labels.range
    .replace("{start}", formatDay(payout.period_start, locale))
    .replace("{end}", formatDay(payout.period_end, locale));
  const withholdingLabel = `${labels.withholding} (${formatRate(payout.withholding_rate, locale)})`;
  return (
    <article className={styles.sheet}>
      <header className={styles.head}>
        <Heading level={2} size="h3">
          {labels.title}
        </Heading>
        <p className={styles.notice} role="note">
          {labels.notInvoice}
        </p>
      </header>
      <dl className={styles.meta}>
        <div>
          <dt>{labels.beneficiary}</dt>
          <dd>{beneficiary}</dd>
        </div>
        <div>
          <dt>{labels.period}</dt>
          <dd>{range}</dd>
        </div>
        <div>
          <dt>{labels.status}</dt>
          <dd>
            <StatusPill tone={payout.status === "paid" ? "done" : "neutral"}>
              {labels.statuses[payout.status]}
            </StatusPill>
          </dd>
        </div>
        {payout.issued_at ? (
          <div>
            <dt>{labels.issuedAt}</dt>
            <dd>{formatDay(payout.issued_at, locale)}</dd>
          </div>
        ) : null}
        {payout.paid_at ? (
          <div>
            <dt>{labels.paidAt}</dt>
            <dd>{formatDay(payout.paid_at, locale)}</dd>
          </div>
        ) : null}
        {payout.paid_reference ? (
          <div>
            <dt>{labels.reference}</dt>
            <dd>{payout.paid_reference}</dd>
          </div>
        ) : null}
        {payout.statement_note ? (
          <div>
            <dt>{labels.note}</dt>
            <dd>{payout.statement_note}</dd>
          </div>
        ) : null}
      </dl>
      <section aria-labelledby={`items-${payout.id}`} className={styles.items}>
        <h3 id={`items-${payout.id}`} className={styles.blockTitle}>
          {labels.itemsTitle}
        </h3>
        <FeeItemTable
          items={items}
          projectNames={projectNames}
          locale={locale}
          labels={labels.items}
        />
      </section>
      <table className={styles.totals}>
        <tbody>
          <tr>
            <th scope="row">{labels.total}</th>
            <td>{formatCents(payout.total, locale)}</td>
          </tr>
          <tr>
            <th scope="row">{withholdingLabel}</th>
            <td>{formatCents(-(payout.total - payout.net_total), locale)}</td>
          </tr>
          <tr data-total="true">
            <th scope="row">{labels.net}</th>
            <td>{formatCents(payout.net_total, locale)}</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
