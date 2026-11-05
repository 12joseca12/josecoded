import { Button } from "@/components/ui/Button/Button";
import { DataTable } from "@/components/ui/DataTable/DataTable";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents } from "@/lib/money";
import type {
  ConfirmHandler,
  ConfirmLabels,
  DocumentRow,
  DocumentTableLabels,
} from "@/types/payments";

import styles from "../ReceivableTable/ReceivableTable.module.css";
import { VoidDocument } from "./VoidDocument";

interface DocumentTableProps {
  rows: DocumentRow[];
  locale: string;
  labels: DocumentTableLabels;
  confirm: ConfirmLabels;
  voidDocument: ConfirmHandler;
}

export function DocumentTable({ rows, locale, labels, confirm, voidDocument }: DocumentTableProps) {
  return (
    <DataTable caption={labels.caption} region={labels.region} size="lg">
      <thead>
        <tr>
          <th scope="col">{labels.columns.contact}</th>
          <th scope="col">{labels.columns.number}</th>
          <th scope="col">{labels.columns.date}</th>
          <th scope="col" data-align="end">
            {labels.columns.net}
          </th>
          <th scope="col" data-align="end">
            {labels.columns.vat}
          </th>
          <th scope="col" data-align="end">
            {labels.columns.gross}
          </th>
          <th scope="col">{labels.columns.status}</th>
          <th scope="col">{labels.columns.actions}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const closed = row.status === "void" || row.status === "paid";
          return (
            <tr key={row.id} data-tone={row.status === "void" ? "muted" : undefined}>
              <th scope="row">
                {row.deals?.contacts?.full_name ?? "—"}
                <span data-sub>{labels.kinds[row.kind]}</span>
              </th>
              <td data-nowrap>{row.number}</td>
              <td data-nowrap>{formatDay(row.issued_at, locale)}</td>
              <td data-align="end">{formatCents(row.amount_net, locale)}</td>
              <td data-align="end">{formatCents(row.vat_amount, locale)}</td>
              <td data-align="end">{formatCents(row.amount_gross, locale)}</td>
              <td>
                <StatusPill
                  tone={
                    row.status === "paid" ? "done" : row.status === "void" ? "muted" : "neutral"
                  }
                >
                  {labels.statuses[row.status]}
                </StatusPill>
              </td>
              <td>
                <div className={styles.actions}>
                  {row.kind === "proforma" && row.status !== "void" ? (
                    <Button
                      variant="light"
                      size="sm"
                      href={`/${locale}/admin/cobros/proformas/${row.id}/imprimir`}
                      aria-label={labels.printAria.replace("{number}", row.number)}
                    >
                      {labels.print}
                    </Button>
                  ) : null}
                  {row.pdf_path !== null ? (
                    <Button
                      variant="light"
                      size="sm"
                      href={`/${locale}/admin/cobros/facturas/${row.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={labels.pdfAria.replace("{number}", row.number)}
                    >
                      {labels.pdf}
                    </Button>
                  ) : null}
                  {closed ? null : (
                    <VoidDocument
                      id={row.id}
                      triggerText={labels.void}
                      triggerAria={labels.voidAria.replace("{number}", row.number)}
                      confirm={confirm}
                      voidDocument={voidDocument}
                    />
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}
