import { DataTable } from "@/components/ui/DataTable/DataTable";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents } from "@/lib/money";
import type { FeeItem, FeeItemStatus } from "@/types/freelance-fees";

export interface FeeItemTableLabels {
  caption: string;
  region: string;
  columns: {
    date: string;
    project: string;
    label: string;
    hours: string;
    amount: string;
    state: string;
  };
  statuses: Record<FeeItemStatus, string>;
  rejected: string;
  empty: string;
}

interface FeeItemTableProps {
  items: FeeItem[];
  projectNames: Record<string, string>;
  locale: string;
  labels: FeeItemTableLabels;
  showProject?: boolean;
}

const tones: Record<FeeItemStatus, "neutral" | "done" | "alert" | "muted"> = {
  pending: "neutral",
  delivered: "neutral",
  approved: "done",
  rejected: "alert",
  paid: "muted",
};

export function FeeItemTable({
  items,
  projectNames,
  locale,
  labels,
  showProject = true,
}: FeeItemTableProps) {
  if (items.length === 0) return <p>{labels.empty}</p>;
  return (
    <DataTable caption={labels.caption} region={labels.region}>
      <thead>
        <tr>
          <th scope="col">{labels.columns.date}</th>
          {showProject ? <th scope="col">{labels.columns.project}</th> : null}
          <th scope="col">{labels.columns.label}</th>
          <th scope="col" data-align="end">
            {labels.columns.hours}
          </th>
          <th scope="col" data-align="end">
            {labels.columns.amount}
          </th>
          <th scope="col">{labels.columns.state}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <th scope="row" data-nowrap>
              {formatDay(item.worked_on, locale)}
            </th>
            {showProject ? <td>{projectNames[item.fee_id] ?? "—"}</td> : null}
            <td>
              {item.label}
              {item.status === "rejected" && item.rejected_reason ? (
                <small> {labels.rejected.replace("{reason}", item.rejected_reason)}</small>
              ) : null}
            </td>
            <td data-align="end">{item.hours ?? "—"}</td>
            <td data-align="end">{formatCents(item.amount, locale)}</td>
            <td>
              <StatusPill tone={tones[item.status]}>{labels.statuses[item.status]}</StatusPill>
            </td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}
