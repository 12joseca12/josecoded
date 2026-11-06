import {
  FeeItemTable,
  type FeeItemTableLabels,
} from "@/components/freelance/FeeItemTable/FeeItemTable";
import { DataTable } from "@/components/ui/DataTable/DataTable";
import { Heading } from "@/components/ui/Heading/Heading";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents, formatRate } from "@/lib/money";
import type { FeeItem, FreelancePayout } from "@/types/freelance-fees";
import type { PayoutRow } from "@/types/money";
import type { PayoutItem, PayoutLine, StatementLabels } from "@/types/payouts";

import styles from "./StatementPrint.module.css";

export interface FreelanceStatementLabels {
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

interface AdminStatementProps {
  variant: "admin";
  payout: PayoutRow;
  lines: PayoutLine[];
  items: PayoutItem[];
  beneficiary: string;
  locale: string;
  labels: StatementLabels;
}

interface FreelanceStatementProps {
  variant: "freelance";
  payout: FreelancePayout;
  items: FeeItem[];
  projectNames: Record<string, string>;
  beneficiary: string;
  locale: string;
  labels: FreelanceStatementLabels;
}

type StatementPrintProps = AdminStatementProps | FreelanceStatementProps;

interface Frame {
  title: string;
  issuer: string | null;
  notice: string;
  statusLabel: string;
  statusText: string;
  cadence: { label: string; value: string } | null;
  summary: string | null;
  footer: string | null;
  labels: {
    beneficiary: string;
    period: string;
    range: string;
    issuedAt: string;
    paidAt: string;
    reference: string;
    note: string;
    total: string;
    withholding: string;
    net: string;
  };
}

function frameOf(props: StatementPrintProps): Frame {
  if (props.variant === "freelance") {
    const { labels, payout } = props;
    return {
      title: labels.title,
      issuer: null,
      notice: labels.notInvoice,
      statusLabel: labels.status,
      statusText: labels.statuses[payout.status],
      cadence: null,
      summary: null,
      footer: null,
      labels,
    };
  }
  const { labels, payout } = props;
  const freelance = payout.kind === "freelance";
  return {
    title: freelance ? labels.items.statementTitle : labels.title,
    issuer: labels.issuer,
    notice: freelance ? labels.items.notInvoice : labels.notPayment,
    statusLabel: labels.status,
    statusText: labels.statuses[payout.status],
    cadence: { label: labels.cadence, value: labels.cadences[payout.cadence] },
    summary: labels.summary,
    footer: labels.footer,
    labels,
  };
}

export function StatementPrint(props: StatementPrintProps) {
  const { payout, beneficiary, locale } = props;
  const frame = frameOf(props);
  const { labels } = frame;
  const start = formatDay(payout.period_start, locale);
  const end = formatDay(payout.period_end, locale);
  const withholding = payout.total - payout.net_total;
  const withholdingLabel = `${labels.withholding} (${formatRate(payout.withholding_rate, locale)})`;
  return (
    <article className={styles.sheet} data-variant={props.variant}>
      <header className={styles.head}>
        <Heading level={2} size="h3">
          {frame.title}
        </Heading>
        {frame.issuer ? <p className={styles.issuer}>{frame.issuer}</p> : null}
        <p className={styles.notice} role="note">
          {frame.notice}
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
        {frame.cadence ? (
          <div>
            <dt>{frame.cadence.label}</dt>
            <dd>{frame.cadence.value}</dd>
          </div>
        ) : null}
        <div>
          <dt>{frame.statusLabel}</dt>
          <dd>
            <StatusPill tone={payout.status === "paid" ? "done" : "neutral"}>
              {frame.statusText}
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

      {props.variant === "freelance" ? (
        <section aria-labelledby={`lines-${payout.id}`} className={styles.lines}>
          <h3 id={`lines-${payout.id}`} className={styles.blockTitle}>
            {props.labels.itemsTitle}
          </h3>
          <FeeItemTable
            items={props.items}
            projectNames={props.projectNames}
            locale={locale}
            labels={props.labels.items}
          />
        </section>
      ) : props.payout.kind === "freelance" ? (
        <AdminItems
          payoutId={payout.id}
          items={props.items}
          locale={locale}
          labels={props.labels}
        />
      ) : (
        <AdminLines
          payoutId={payout.id}
          lines={props.lines}
          locale={locale}
          labels={props.labels}
        />
      )}

      <table className={styles.totals}>
        {frame.summary ? <caption className={styles.caption}>{frame.summary}</caption> : null}
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
      {frame.footer ? <p className={styles.muted}>{frame.footer}</p> : null}
    </article>
  );
}

interface AdminBlockProps {
  payoutId: string;
  locale: string;
  labels: StatementLabels;
}

function AdminItems({
  payoutId,
  items,
  locale,
  labels,
}: AdminBlockProps & { items: PayoutItem[] }) {
  return (
    <section aria-labelledby={`lines-${payoutId}`} className={styles.lines}>
      <h3 id={`lines-${payoutId}`} className={styles.blockTitle}>
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
                <td data-align="end">{item.hours === null ? "—" : `${String(item.hours)} h`}</td>
                <td data-align="end">{formatCents(item.amount, locale)}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}

function AdminLines({
  payoutId,
  lines,
  locale,
  labels,
}: AdminBlockProps & { lines: PayoutLine[] }) {
  return (
    <section aria-labelledby={`lines-${payoutId}`} className={styles.lines}>
      <h3 id={`lines-${payoutId}`} className={styles.blockTitle}>
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
  );
}
