import { DataTable } from "@/components/ui/DataTable/DataTable";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { isOverdueRow } from "@/lib/admin/payments";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents } from "@/lib/money";
import type {
  ConfirmLabels,
  DocumentRow,
  InvoiceSheetLabels,
  PaymentsPageHandlers,
  ProformaSheetLabels,
  ReceivableActionLabels,
  ReceivableRow,
  ReceivableTableLabels,
  RecordPaymentLabels,
} from "@/types/payments";

import { ReceivableActions } from "./ReceivableActions";
import styles from "./ReceivableTable.module.css";

interface ReceivableTableProps {
  rows: ReceivableRow[];
  schedule: ReceivableRow[];
  documents: DocumentRow[];
  paidBySchedule: Record<string, number>;
  locale: string;
  today: string;
  vat: string;
  labels: ReceivableTableLabels;
  actionLabels: {
    actions: ReceivableActionLabels;
    record: RecordPaymentLabels;
    proforma: ProformaSheetLabels;
    invoice: InvoiceSheetLabels;
    confirm: ConfirmLabels;
  };
  handlers: PaymentsPageHandlers;
}

export function ReceivableTable({
  rows,
  schedule,
  documents,
  paidBySchedule,
  locale,
  today,
  vat,
  labels,
  actionLabels,
  handlers,
}: ReceivableTableProps) {
  return (
    <DataTable caption={labels.caption} region={labels.region} size="lg">
      <thead>
        <tr>
          <th scope="col">{labels.columns.contact}</th>
          <th scope="col">{labels.columns.label}</th>
          <th scope="col" data-align="end">
            {labels.columns.amount}
          </th>
          <th scope="col" data-align="end">
            {labels.columns.paid}
          </th>
          <th scope="col">{labels.columns.due}</th>
          <th scope="col">{labels.columns.status}</th>
          <th scope="col">{labels.columns.actions}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const contactName = row.deals?.contacts?.full_name ?? "—";
          const overdue = isOverdueRow(row, today);
          const dealRows = schedule.filter((entry) => entry.deal_id === row.deal_id);
          return (
            <tr key={row.id} data-tone={row.status === "cancelled" ? "muted" : undefined}>
              <th scope="row">
                {contactName}
                <span data-sub>{labels.kinds[row.kind]}</span>
              </th>
              <td>{row.label}</td>
              <td data-align="end">{formatCents(row.amount, locale)}</td>
              <td data-align="end">
                {labels.paidOf
                  .replace("{paid}", formatCents(paidBySchedule[row.id] ?? 0, locale))
                  .replace("{total}", formatCents(row.amount, locale))}
              </td>
              <td data-nowrap>
                {row.due_at === null ? labels.noDue : formatDay(row.due_at, locale)}
              </td>
              <td>
                <StatusPill
                  tone={
                    overdue
                      ? "alert"
                      : row.status === "paid"
                        ? "done"
                        : row.status === "cancelled"
                          ? "muted"
                          : "neutral"
                  }
                >
                  {overdue ? labels.overdue : labels.statuses[row.status]}
                </StatusPill>
              </td>
              <td>
                <div className={styles.actions}>
                  <ReceivableActions
                    scheduleId={row.id}
                    dealId={row.deal_id}
                    label={row.label}
                    contactName={contactName}
                    status={row.status}
                    amountCents={row.amount}
                    locale={locale}
                    today={today}
                    vat={vat}
                    deals={[{ id: row.deal_id, label: contactName }]}
                    schedule={dealRows
                      .filter((entry) => entry.status !== "cancelled")
                      .map((entry) => ({
                        id: entry.id,
                        dealId: entry.deal_id,
                        label: entry.label,
                        nature: entry.kind === "recurring" ? "recurring" : "project",
                        remainingCents: Math.max(0, entry.amount - (paidBySchedule[entry.id] ?? 0)),
                      }))}
                    invoices={documents
                      .filter((entry) => entry.deal_id === row.deal_id && entry.status !== "void")
                      .map((entry) => ({
                        id: entry.id,
                        dealId: entry.deal_id,
                        label: entry.number,
                      }))}
                    labels={actionLabels}
                    handlers={handlers}
                  />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}
