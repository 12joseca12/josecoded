import { DataTable } from "@/components/ui/DataTable/DataTable";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { StatusPill, type StatusPillTone } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents, formatRate } from "@/lib/money";
import type { DealMoneyData, DealMoneyLabels } from "@/types/deal-win";
import type { CommissionLine, ScheduleItem } from "@/types/money";

import styles from "./DealMoney.module.css";

export interface MoneyDeal {
  id: string;
  label: string;
}

interface DealMoneyProps {
  deals: MoneyDeal[];
  data: DealMoneyData;
  names: Record<string, string>;
  locale: string;
  isAdmin: boolean;
  today: string;
  labels: DealMoneyLabels;
}

const openScheduleStatuses: readonly ScheduleItem["status"][] = [
  "scheduled",
  "proforma_sent",
  "invoiced",
];

function lineTone(status: CommissionLine["status"]): StatusPillTone {
  if (status === "paid") return "done";
  if (status === "rejected" || status === "reversed") return "muted";
  return "neutral";
}

function scheduleTone(status: ScheduleItem["status"]): StatusPillTone {
  if (status === "paid") return "done";
  if (status === "cancelled") return "muted";
  return "neutral";
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

export function DealMoney({ deals, data, names, locale, isAdmin, today, labels }: DealMoneyProps) {
  return (
    <div className={styles.deals}>
      {deals.map((deal) => {
        const header = data.commissions.find((entry) => entry.deal_id === deal.id);
        const schedule = data.schedule.filter((entry) => entry.deal_id === deal.id);
        const payments = data.payments.filter((entry) => entry.deal_id === deal.id);
        const invoices = data.invoices.filter((entry) => entry.deal_id === deal.id);
        const paymentDates = new Map(payments.map((payment) => [payment.id, payment.received_at]));
        const lines = header ? data.lines.filter((line) => line.commission_id === header.id) : [];
        const person = (id: string | null) =>
          id === null ? labels.unknownPerson : (names[id] ?? labels.unknownPerson);
        return (
          <section key={deal.id} className={styles.deal} aria-labelledby={`money-${deal.id}`}>
            <Heading level={3} size="h4" id={`money-${deal.id}`}>
              {fill(labels.dealHeading, { name: deal.label })}
            </Heading>

            <div className={styles.block}>
              <h4 className={styles.blockTitle}>{labels.expected}</h4>
              {header ? (
                <ul className={styles.expected}>
                  <li>
                    {fill(labels.expectedLine, {
                      name: person(header.closer_id),
                      rate: formatRate(header.closer_rate, locale),
                      amount: formatCents(header.expected_closer_amount, locale),
                    })}
                  </li>
                  {header.subcloser_id !== null && header.subcloser_rate !== null ? (
                    <li>
                      {fill(labels.expectedLine, {
                        name: person(header.subcloser_id),
                        rate: formatRate(header.subcloser_rate, locale),
                        amount: formatCents(header.expected_subcloser_amount, locale),
                      })}
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className={styles.muted}>{labels.expectedNone}</p>
              )}
            </div>

            <div className={styles.block}>
              <h4 className={styles.blockTitle}>{labels.scheduleTitle}</h4>
              {schedule.length === 0 ? (
                <p className={styles.muted}>{labels.scheduleEmpty}</p>
              ) : (
                <DataTable caption={labels.scheduleTitle} region={labels.tableLabel} size="sm">
                  <thead>
                    <tr>
                      <th scope="col">{labels.scheduleColumns.label}</th>
                      <th scope="col" data-align="end">
                        {labels.scheduleColumns.amount}
                      </th>
                      <th scope="col">{labels.scheduleColumns.due}</th>
                      <th scope="col">{labels.scheduleColumns.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((item) => {
                      const overdue =
                        item.due_at !== null &&
                        item.due_at < today &&
                        openScheduleStatuses.includes(item.status);
                      return (
                        <tr
                          key={item.id}
                          data-tone={item.status === "cancelled" ? "muted" : undefined}
                        >
                          <th scope="row">
                            {item.label}
                            <span data-sub>{labels.scheduleKinds[item.kind]}</span>
                          </th>
                          <td data-align="end">{formatCents(item.amount, locale)}</td>
                          <td data-nowrap>
                            {item.due_at === null ? "—" : formatDay(item.due_at, locale)}
                          </td>
                          <td>
                            <StatusPill tone={overdue ? "alert" : scheduleTone(item.status)}>
                              {overdue ? labels.overdue : labels.scheduleStatuses[item.status]}
                            </StatusPill>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </DataTable>
              )}
            </div>

            <div className={styles.block}>
              <h4 className={styles.blockTitle}>{labels.paymentsTitle}</h4>
              {payments.length === 0 ? (
                <p className={styles.muted}>{labels.paymentsEmpty}</p>
              ) : (
                <DataTable caption={labels.paymentsTitle} region={labels.tableLabel} size="sm">
                  <thead>
                    <tr>
                      <th scope="col">{labels.paymentsColumns.date}</th>
                      <th scope="col">{labels.paymentsColumns.kind}</th>
                      <th scope="col">{labels.paymentsColumns.nature}</th>
                      <th scope="col" data-align="end">
                        {labels.paymentsColumns.amount}
                      </th>
                      {isAdmin ? <th scope="col">{labels.paymentsColumns.method}</th> : null}
                      {isAdmin ? <th scope="col">{labels.paymentsColumns.reference}</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        data-tone={payment.kind === "refund" ? "error" : undefined}
                      >
                        <th scope="row" data-nowrap>
                          {formatDay(payment.received_at, locale)}
                        </th>
                        <td>{labels.paymentKinds[payment.kind]}</td>
                        <td>{labels.natures[payment.nature]}</td>
                        <td data-align="end">
                          {formatCents(
                            payment.kind === "refund" ? -payment.amount_net : payment.amount_net,
                            locale,
                          )}
                        </td>
                        {isAdmin ? (
                          <td>
                            {payment.method === null ? "—" : labels.paymentMethods[payment.method]}
                          </td>
                        ) : null}
                        {isAdmin ? <td>{payment.reference ?? "—"}</td> : null}
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              )}
            </div>

            <div className={styles.block}>
              <h4 className={styles.blockTitle}>{labels.linesTitle}</h4>
              {lines.length === 0 ? (
                <p className={styles.muted}>{labels.linesEmpty}</p>
              ) : (
                <DataTable caption={labels.linesTitle} region={labels.tableLabel} size="md">
                  <thead>
                    <tr>
                      <th scope="col">{labels.linesColumns.date}</th>
                      <th scope="col">{labels.linesColumns.beneficiary}</th>
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
                      <th scope="col">{labels.linesColumns.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => {
                      const received =
                        line.payment_id === null ? undefined : paymentDates.get(line.payment_id);
                      return (
                        <tr key={line.id} data-tone={line.amount < 0 ? "error" : undefined}>
                          <th scope="row" data-nowrap>
                            {formatDay(received ?? line.created_at, locale)}
                          </th>
                          <td>
                            {person(line.beneficiary_id)}
                            <span data-sub>{labels.roles[line.role]}</span>
                          </td>
                          <td>{labels.natures[line.nature]}</td>
                          <td data-align="end">{formatCents(line.base, locale)}</td>
                          <td data-align="end">{formatRate(line.rate, locale)}</td>
                          <td data-align="end">{formatCents(line.amount, locale)}</td>
                          <td>
                            <StatusPill tone={lineTone(line.status)}>
                              {labels.lineStatuses[line.status]}
                            </StatusPill>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </DataTable>
              )}
            </div>

            {isAdmin ? (
              <div className={styles.block}>
                <h4 className={styles.blockTitle}>{labels.invoicesTitle}</h4>
                {invoices.length === 0 ? (
                  <p className={styles.muted}>{labels.invoicesEmpty}</p>
                ) : (
                  <DataTable caption={labels.invoicesTitle} region={labels.tableLabel} size="md">
                    <thead>
                      <tr>
                        <th scope="col">{labels.invoicesColumns.number}</th>
                        <th scope="col">{labels.invoicesColumns.date}</th>
                        <th scope="col" data-align="end">
                          {labels.invoicesColumns.net}
                        </th>
                        <th scope="col" data-align="end">
                          {labels.invoicesColumns.vat}
                        </th>
                        <th scope="col" data-align="end">
                          {labels.invoicesColumns.gross}
                        </th>
                        <th scope="col">{labels.invoicesColumns.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          data-tone={invoice.status === "void" ? "muted" : undefined}
                        >
                          <th scope="row">
                            {invoice.number}
                            <span data-sub>{labels.invoiceKinds[invoice.kind]}</span>
                          </th>
                          <td data-nowrap>{formatDay(invoice.issued_at, locale)}</td>
                          <td data-align="end">{formatCents(invoice.amount_net, locale)}</td>
                          <td data-align="end">{formatCents(invoice.vat_amount, locale)}</td>
                          <td data-align="end">{formatCents(invoice.amount_gross, locale)}</td>
                          <td>
                            <StatusPill tone={invoice.status === "paid" ? "done" : "neutral"}>
                              {labels.invoiceStatuses[invoice.status]}
                            </StatusPill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </DataTable>
                )}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

export function DealMoneyEmpty({ labels }: { labels: DealMoneyLabels }) {
  return <EmptyState headingLevel={3} title={labels.empty} text={labels.emptyText} />;
}
