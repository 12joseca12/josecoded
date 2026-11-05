import { Button } from "@/components/ui/Button/Button";
import { DataTable } from "@/components/ui/DataTable/DataTable";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents, formatRate } from "@/lib/money";
import type { PayoutRow } from "@/types/money";
import type { PayoutListLabels } from "@/types/payouts";

interface PayoutListProps {
  rows: PayoutRow[];
  names: Record<string, string>;
  locale: string;
  labels: PayoutListLabels;
}

export function PayoutList({ rows, names, locale, labels }: PayoutListProps) {
  return (
    <DataTable caption={labels.caption} region={labels.region} size="lg">
      <thead>
        <tr>
          <th scope="col">{labels.columns.beneficiary}</th>
          <th scope="col">{labels.columns.period}</th>
          <th scope="col">{labels.columns.cadence}</th>
          <th scope="col" data-align="end">
            {labels.columns.total}
          </th>
          <th scope="col" data-align="end">
            {labels.columns.withholding}
          </th>
          <th scope="col" data-align="end">
            {labels.columns.net}
          </th>
          <th scope="col">{labels.columns.status}</th>
          <th scope="col">{labels.columns.reference}</th>
          <th scope="col">{labels.columns.actions}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const name = names[row.beneficiary_id] ?? "—";
          const start = formatDay(row.period_start, locale);
          const end = formatDay(row.period_end, locale);
          return (
            <tr key={row.id}>
              <th scope="row">{name}</th>
              <td data-nowrap>{labels.range.replace("{start}", start).replace("{end}", end)}</td>
              <td>{labels.cadences[row.cadence]}</td>
              <td data-align="end">{formatCents(row.total, locale)}</td>
              <td data-align="end">
                {row.withholding_rate === 0
                  ? labels.none
                  : formatRate(row.withholding_rate, locale)}
              </td>
              <td data-align="end">{formatCents(row.net_total, locale)}</td>
              <td>
                <StatusPill
                  tone={
                    row.status === "paid" ? "done" : row.status === "draft" ? "muted" : "neutral"
                  }
                >
                  {labels.statuses[row.status]}
                </StatusPill>
              </td>
              <td>{row.paid_reference ?? labels.none}</td>
              <td>
                <Button
                  variant="light"
                  size="sm"
                  href={`/${locale}/admin/liquidaciones/${row.id}`}
                  aria-label={labels.openAria
                    .replace("{name}", name)
                    .replace("{start}", start)
                    .replace("{end}", end)}
                >
                  {labels.open}
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}
