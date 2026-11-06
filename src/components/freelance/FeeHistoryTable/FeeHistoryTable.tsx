import NextLink from "next/link";

import { DataTable } from "@/components/ui/DataTable/DataTable";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatCents } from "@/lib/money";
import type { FeeMode, FeeSummary } from "@/types/freelance-fees";

export interface FeeHistoryLabels {
  caption: string;
  region: string;
  columns: {
    project: string;
    mode: string;
    agreed: string;
    approved: string;
    paid: string;
    state: string;
  };
  modes: Record<FeeMode, string>;
  open: string;
  closed: string;
  variable: string;
}

interface FeeHistoryTableProps {
  rows: FeeSummary[];
  locale: string;
  labels: FeeHistoryLabels;
  hrefFor: (projectId: string) => string;
}

export function FeeHistoryTable({ rows, locale, labels, hrefFor }: FeeHistoryTableProps) {
  return (
    <DataTable caption={labels.caption} region={labels.region}>
      <thead>
        <tr>
          <th scope="col">{labels.columns.project}</th>
          <th scope="col">{labels.columns.mode}</th>
          <th scope="col" data-align="end">
            {labels.columns.agreed}
          </th>
          <th scope="col" data-align="end">
            {labels.columns.approved}
          </th>
          <th scope="col" data-align="end">
            {labels.columns.paid}
          </th>
          <th scope="col">{labels.columns.state}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const closed = row.closed_at !== null || row.project_archived_at !== null;
          return (
            <tr key={row.fee_id}>
              <th scope="row">
                <NextLink href={hrefFor(row.project_id)}>{row.project_name}</NextLink>
              </th>
              <td>{labels.modes[row.mode]}</td>
              <td data-align="end">
                {row.agreed_total === null || row.agreed_total === 0
                  ? labels.variable
                  : formatCents(row.agreed_total, locale)}
              </td>
              <td data-align="end">
                {formatCents(row.approved_unpaid_amount + row.paid_amount, locale)}
              </td>
              <td data-align="end">{formatCents(row.paid_amount, locale)}</td>
              <td>
                <StatusPill tone={closed ? "muted" : "neutral"}>
                  {closed ? labels.closed : labels.open}
                </StatusPill>
              </td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}
