import { DataTable } from "@/components/ui/DataTable/DataTable";
import { Heading } from "@/components/ui/Heading/Heading";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents, formatRate } from "@/lib/money";
import type { PayoutRow } from "@/types/money";
import type { PayoutItem, PayoutLine, StatementLabels } from "@/types/payouts";

import styles from "./StatementPrint.module.css";

interface StatementPrintProps {
  payout: PayoutRow;
  lines: PayoutLine[];
  items: PayoutItem[];
  beneficiary: string;
  locale: string;
  labels: StatementLabels;
}

export function StatementPrint({
  payout,
  lines,
  items,
  beneficiary,
  locale,
  labels,
}: StatementPrintProps) {
  const freelance = payout.kind === "freelance";
  const start = formatDay(payout.period_start, locale);
  const end = formatDay(payout.period_end, locale);
  const withholding = payout.total - payout.net_total;
  const withholdingLabel = `${labels.withholding} (${formatRate(payout.withholding_rate, locale)})`;
  return (
    <article className={styles.sheet}>
      <header className={styles.head}>
        <Heading level={2} size="h3">
          {freelance ? labels.items.statementTitle : labels.title}
        </Heading>
        <p className={styles.issuer}>{labels.issuer}</p>
        <p className={styles.notice} role="note">
          {freelance ? labels.items.notInvoice : labels.notPayment}
        </p>
      </header>

      <dl className={styles.meta}>
        <div>
          <dt>{labels.beneficiary}</dt>
          <dd>{beneficiary}</dd>
        </div>
        <div>
          <dt>{labels.period}</dt>
          <dd>{labels.range.replace("{start}", start).replace("{end}", end)}</dd>
        </div>
        <div>
          <dt>{labels.cadence}</dt>
          <dd>{labels.cadences[payout.cadence]}</dd>
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

      {freelance ? (
        <section aria-labelledby={`lines-${payout.id}`} className={styles.lines}>
          <h3 id={`lines-${payout.id}`} className={styles.blockTitle}>
            {labels.items.title}
          </h3>
          {items.length === 0 ? (
            <p className={styles.muted}>{labels.items.empty}</p>
          ) : (
            <DataTable caption={labels.items.caption} region={labels.items.region} size="md">
              <thead>
                <tr>
                  <th scope="col">{labels.items.columns.date}</th>
                  <th scope="col">{labels.items.columns.label}</th>
                  <th scope="col" data-align="end">
                    {labels.items.columns.hours}
                  </th>
                  <th scope="col" data-align="end">
                    {labels.items.columns.amount}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <th scope="row" data-nowrap>
                      {formatDay(item.worked_on, locale)}
                    </th>
                    <td>{item.label}</td>
                    <td data-align="end">
                      {item.hours === null ? "—" : `${String(item.hours)} h`}
                    </td>
                    <td data-align="end">{formatCents(item.amount, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </section>
      ) : (
        <section aria-labelledby={`lines-${payout.id}`} className={styles.lines}>
          <h3 id={`lines-${payout.id}`} className={styles.blockTitle}>
            {labels.linesTitle}
          </h3>
          {lines.length === 0 ? (
            <p className={styles.muted}>{labels.linesEmpty}</p>
          ) : (
            <DataTable caption={labels.linesCaption} region={labels.linesRegion} size="md">
              <thead>
                <tr>
                  <th scope="col">{labels.linesColumns.date}</th>
                  <th scope="col">{labels.linesColumns.contact}</th>
                  <th scope="col">{labels.linesColumns.nature}</th>
                  <th scope="col" data-align="end">
                    {labels.linesColumns.base}
                  </th>
                  <th scope="col" data-align="end">
                    {labels.linesColumns.rate}
                  </th>
                  <th scope="col" data-align="end">
                    {labels.linesColumns.amount}
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} data-tone={line.amount < 0 ? "error" : undefined}>
                    <th scope="row" data-nowrap>
                      {line.payments ? formatDay(line.payments.received_at, locale) : "—"}
                    </th>
                    <td>{line.commissions?.deals?.contacts?.full_name ?? "—"}</td>
                    <td>{labels.natures[line.nature]}</td>
                    <td data-align="end">{formatCents(line.base, locale)}</td>
                    <td data-align="end">{formatRate(line.rate, locale)}</td>
                    <td data-align="end">{formatCents(line.amount, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </section>
      )}

      <table className={styles.totals}>
        <caption className={styles.caption}>{labels.summary}</caption>
        <tbody>
          <tr>
            <th scope="row">{labels.total}</th>
            <td>{formatCents(payout.total, locale)}</td>
          </tr>
          <tr>
            <th scope="row">{withholdingLabel}</th>
            <td>{formatCents(-withholding, locale)}</td>
          </tr>
          <tr data-total="true">
            <th scope="row">{labels.net}</th>
            <td>{formatCents(payout.net_total, locale)}</td>
          </tr>
        </tbody>
      </table>
      <p className={styles.muted}>{labels.footer}</p>
    </article>
  );
}
