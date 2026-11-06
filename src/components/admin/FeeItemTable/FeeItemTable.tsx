"use client";

import { useState, useTransition } from "react";

import { RejectItemSheet } from "@/components/admin/RejectItemSheet/RejectItemSheet";
import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { DataTable } from "@/components/ui/DataTable/DataTable";
import { StatusPill, type StatusPillTone } from "@/components/ui/StatusPill/StatusPill";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents } from "@/lib/money";
import type {
  FeeHandler,
  FeeItem,
  FeeItemStatus,
  FeeItemTableLabels,
} from "@/types/admin-project-fee";

import styles from "./FeeItemTable.module.css";

interface FeeItemTableProps {
  items: FeeItem[];
  freelanceId: string;
  locale: string;
  labels: FeeItemTableLabels;
  handlers: { approve: FeeHandler; reject: FeeHandler; remove: FeeHandler };
}

const tones: Record<FeeItemStatus, StatusPillTone> = {
  pending: "muted",
  delivered: "alert",
  approved: "neutral",
  rejected: "muted",
  paid: "done",
};

const approvable = new Set<FeeItemStatus>(["pending", "delivered"]);

export function FeeItemTable({ items, freelanceId, locale, labels, handlers }: FeeItemTableProps) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [problem, setProblem] = useState("");
  const [approving, startApproving] = useTransition();
  const [removing, startRemoving] = useTransition();
  const announce = useAnnounce();

  if (items.length === 0) return <p className={styles.empty}>{labels.empty}</p>;

  const toggle = (id: string, on: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const approve = () => {
    if (approving || selected.size === 0) return;
    setProblem("");
    startApproving(async () => {
      const result = await handlers.approve({ ids: [...selected] });
      if (result.status === "done") {
        announce(labels.approved.replace("{count}", String(result.count ?? selected.size)));
        setSelected(new Set());
        return;
      }
      setProblem(labels.errors[result.status === "invalid" ? result.field : result.code]);
    });
  };

  const remove = (id: string) => {
    if (removing) return;
    setProblem("");
    startRemoving(async () => {
      const result = await handlers.remove({ id });
      if (result.status === "done") {
        announce(labels.deleted);
        return;
      }
      setProblem(labels.errors[result.status === "invalid" ? result.field : result.code]);
    });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <Button
          variant="light"
          size="sm"
          disabled={selected.size === 0}
          loading={approving}
          loadingLabel={labels.approving}
          onClick={approve}
        >
          {labels.approve.replace("{count}", String(selected.size))}
        </Button>
      </div>
      <p className={styles.feedback} role="alert">
        {problem}
      </p>
      <DataTable caption={labels.caption} region={labels.region} size="lg">
        <thead>
          <tr>
            <th scope="col">{labels.columns.select}</th>
            <th scope="col">{labels.columns.label}</th>
            <th scope="col" data-align="end">
              {labels.columns.hours}
            </th>
            <th scope="col" data-align="end">
              {labels.columns.amount}
            </th>
            <th scope="col">{labels.columns.date}</th>
            <th scope="col">{labels.columns.by}</th>
            <th scope="col">{labels.columns.status}</th>
            <th scope="col">{labels.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} data-status={item.status}>
              <td>
                {approvable.has(item.status) ? (
                  <Checkbox
                    name={`select-${item.id}`}
                    checked={selected.has(item.id)}
                    onChange={(event) => {
                      toggle(item.id, event.currentTarget.checked);
                    }}
                  >
                    <VisuallyHidden>{labels.select.replace("{label}", item.label)}</VisuallyHidden>
                  </Checkbox>
                ) : null}
              </td>
              <th scope="row">
                {item.label}
                {item.rejected_reason === null ? null : (
                  <span className={styles.reason}>
                    {labels.rejectedReason.replace("{reason}", item.rejected_reason)}
                  </span>
                )}
              </th>
              <td data-align="end">{item.hours === null ? "—" : `${String(item.hours)} h`}</td>
              <td data-align="end">{formatCents(item.amount, locale)}</td>
              <td data-nowrap>{formatDay(item.worked_on, locale)}</td>
              <td>{item.submitted_by === freelanceId ? labels.by.freelance : labels.by.jose}</td>
              <td>
                <StatusPill tone={tones[item.status]}>{labels.statuses[item.status]}</StatusPill>
              </td>
              <td>
                <div className={styles.actions}>
                  {approvable.has(item.status) ? (
                    <RejectItemSheet
                      id={item.id}
                      itemLabel={item.label}
                      labels={labels}
                      reject={handlers.reject}
                    />
                  ) : null}
                  {item.status === "pending" ? (
                    <Button
                      variant="quiet"
                      size="sm"
                      aria-label={labels.deleteFor.replace("{label}", item.label)}
                      disabled={removing}
                      onClick={() => {
                        remove(item.id);
                      }}
                    >
                      {labels.delete}
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}
