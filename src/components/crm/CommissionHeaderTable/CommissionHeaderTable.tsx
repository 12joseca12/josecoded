import { DataTable } from "@/components/ui/DataTable/DataTable";
import { formatCents, formatRate } from "@/lib/money";
import type {
  CommissionHeaderRow,
  CommissionHeaderTableLabels,
  CommissionLineRow,
} from "@/types/commissions";

interface CommissionHeaderTableProps {
  rows: CommissionHeaderRow[];
  lines: CommissionLineRow[];
  names: Record<string, string>;
  locale: string;
  labels: CommissionHeaderTableLabels;
}

function rateText(
  project: number,
  recurring: number | null,
  locale: string,
  labels: CommissionHeaderTableLabels,
): string {
  return labels.rates
    .replace("{project}", formatRate(project, locale))
    .replace(
      "{recurring}",
      recurring === null ? labels.noRecurring : formatRate(recurring, locale),
    );
}

export function CommissionHeaderTable({
  rows,
  lines,
  names,
  locale,
  labels,
}: CommissionHeaderTableProps) {
  return (
    <DataTable caption={labels.caption} region={labels.region} size="lg">
      <thead>
        <tr>
          <th scope="col">{labels.columns.contact}</th>
          <th scope="col">{labels.columns.closer}</th>
          <th scope="col">{labels.columns.subcloser}</th>
          <th scope="col">{labels.columns.rates}</th>
          <th scope="col" data-align="end">
            {labels.columns.expected}
          </th>
          <th scope="col" data-align="end">
            {labels.columns.accrued}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const accrued = lines
            .filter((line) => line.commission_id === row.id && line.status !== "rejected")
            .reduce((sum, line) => sum + line.amount, 0);
          return (
            <tr key={row.id}>
              <th scope="row">{row.deals?.contacts?.full_name ?? "—"}</th>
              <td>{names[row.closer_id] ?? labels.unknownPerson}</td>
              <td>
                {row.subcloser_id === null
                  ? "—"
                  : (names[row.subcloser_id] ?? labels.unknownPerson)}
              </td>
              <td>
                {rateText(row.closer_rate, row.closer_recurring_rate, locale, labels)}
                {row.subcloser_rate === null ? null : (
                  <span data-sub>
                    {rateText(row.subcloser_rate, row.subcloser_recurring_rate, locale, labels)}
                  </span>
                )}
              </td>
              <td data-align="end">
                {formatCents(row.expected_closer_amount + row.expected_subcloser_amount, locale)}
              </td>
              <td data-align="end">{formatCents(accrued, locale)}</td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}
