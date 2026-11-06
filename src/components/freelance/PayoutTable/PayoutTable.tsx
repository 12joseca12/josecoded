import NextLink from "next/link";

import { DataTable } from "@/components/ui/DataTable/DataTable";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents } from "@/lib/money";
import type { FreelancePayout } from "@/types/freelance-fees";

export interface PayoutTableLabels {
  caption: string;
  region: string;
  columns: {
    period: string;
    total: string;
    withholding: string;
    net: string;
    state: string;
    reference: string;
    statement: string;
  };
  range: string;
  statuses: Record<FreelancePayout["status"], string>;
  open: string;
  openFor: string;
}

interface PayoutTableProps {
  rows: FreelancePayout[];
  locale: string;
  labels: PayoutTableLabels;
  hrefFor: (id: string) => string;
}

export function PayoutTable({ rows, locale, labels, hrefFor }: PayoutTableProps) {
  return (
    <DataTable caption={labels.caption} region={labels.region}>
      <thead>
        <tr>
          <th scope="col">{labels.columns.period}</th>
          <th scope="col" data-align="end">
            {labels.columns.total}
          </th>
          <th scope="col" data-align="end">
            {labels.columns.withholding}
          </th>
          <th scope="col" data-align="end">
            {labels.columns.net}
          </th>
          <th scope="col">{labels.columns.state}</th>
          <th scope="col">{labels.columns.reference}</th>
          <th scope="col">{labels.columns.statement}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const range = labels.range
            .replace("{start}", formatDay(row.period_start, locale))
            .replace("{end}", formatDay(row.period_end, locale));
          return (
            <tr key={row.id}>
              <th scope="row">{range}</th>
              <td data-align="end">{formatCents(row.total, locale)}</td>
              <td data-align="end">{formatCents(row.total - row.net_total, locale)}</td>
              <td data-align="end">{formatCents(row.net_total, locale)}</td>
              <td>
                <StatusPill tone={row.status === "paid" ? "done" : "neutral"}>
                  {labels.statuses[row.status]}
                </StatusPill>
              </td>
              <td>{row.paid_reference ?? "—"}</td>
              <td>
                <NextLink
                  href={hrefFor(row.id)}
                  aria-label={labels.openFor.replace("{range}", range)}
                >
                  {labels.open}
                </NextLink>
              </td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}
