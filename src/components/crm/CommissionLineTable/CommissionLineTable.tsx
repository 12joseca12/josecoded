"use client";

import { useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { DataTable } from "@/components/ui/DataTable/DataTable";
import { StatusPill, type StatusPillTone } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents, formatRate } from "@/lib/money";
import type {
  ApproveHandler,
  CommissionLineRow,
  CommissionLineTableLabels,
  PayoutRef,
  RejectHandler,
} from "@/types/commissions";

import styles from "./CommissionLineTable.module.css";
import { RejectLineSheet } from "./RejectLineSheet";

interface CommissionLineTableProps {
  rows: CommissionLineRow[];
  names: Record<string, string>;
  payouts: PayoutRef[];
  locale: string;
  canApprove: boolean;
  labels: CommissionLineTableLabels;
  approve: ApproveHandler;
  reject: RejectHandler;
}

function toneOf(status: CommissionLineRow["status"]): StatusPillTone {
  if (status === "paid") return "done";
  if (status === "rejected" || status === "reversed") return "muted";
  return "neutral";
}

export function CommissionLineTable({
  rows,
  names,
  payouts,
  locale,
  canApprove,
  labels,
  approve,
  reject,
}: CommissionLineTableProps) {
  const announce = useAnnounce();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [problem, setProblem] = useState("");
  const [saving, startSaving] = useTransition();

  const accrued = rows.filter((row) => row.status === "accrued");
  const allSelected = accrued.length > 0 && accrued.every((row) => selected.has(row.id));
  const count = [...selected].filter((id) => accrued.some((row) => row.id === id)).length;

  const toggle = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onApprove = () => {
    if (saving || count === 0) return;
    setProblem("");
    startSaving(async () => {
      const result = await approve({
        ids: [...selected].filter((id) => accrued.some((row) => row.id === id)),
      });
      if (result.status === "done") {
        setSelected(new Set());
        announce(labels.approve.done);
        return;
      }
      setProblem(labels.approve.errors[result.code]);
    });
  };

  return (
    <div className={styles.wrap}>
      {canApprove ? (
        <div className={styles.bar} role="group" aria-label={labels.approve.none}>
          <p className={styles.count} aria-live="polite">
            {labels.approve.selected.replace("{count}", String(count))}
          </p>
          <Button
            variant="primary"
            size="sm"
            disabled={count === 0}
            loading={saving}
            loadingLabel={labels.approve.saving}
            onClick={onApprove}
          >
            {count === 0
              ? labels.approve.none
              : labels.approve.submit.replace("{count}", String(count))}
          </Button>
          <p className={styles.problem} role="alert" hidden={problem === ""}>
            {problem}
          </p>
        </div>
      ) : null}
      <DataTable caption={labels.caption} region={labels.region} size="lg">
        <thead>
          <tr>
            {canApprove ? (
              <th scope="col">
                <input
                  type="checkbox"
                  className={styles.check}
                  aria-label={labels.selectAll}
                  checked={allSelected}
                  disabled={accrued.length === 0}
                  onChange={() => {
                    setSelected(allSelected ? new Set() : new Set(accrued.map((row) => row.id)));
                  }}
                />
              </th>
            ) : null}
            <th scope="col">{labels.columns.date}</th>
            <th scope="col">{labels.columns.contact}</th>
            <th scope="col">{labels.columns.beneficiary}</th>
            <th scope="col">{labels.columns.nature}</th>
            <th scope="col" data-align="end">
              {labels.columns.base}
            </th>
            <th scope="col" data-align="end">
              {labels.columns.rate}
            </th>
            <th scope="col" data-align="end">
              {labels.columns.amount}
            </th>
            <th scope="col">{labels.columns.status}</th>
            <th scope="col">{labels.columns.payout}</th>
            {canApprove ? <th scope="col">{labels.columns.actions}</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const contact = row.commissions?.deals?.contacts?.full_name ?? "—";
            const payout =
              row.payout_id === null ? null : payouts.find((entry) => entry.id === row.payout_id);
            const amount = formatCents(row.amount, locale);
            return (
              <tr key={row.id} data-tone={row.amount < 0 ? "error" : undefined}>
                {canApprove ? (
                  <td>
                    {row.status === "accrued" ? (
                      <input
                        type="checkbox"
                        className={styles.check}
                        aria-label={labels.selectAria
                          .replace("{name}", contact)
                          .replace("{amount}", amount)}
                        checked={selected.has(row.id)}
                        onChange={() => {
                          toggle(row.id);
                        }}
                      />
                    ) : null}
                  </td>
                ) : null}
                <td data-nowrap>{formatDay(row.created_at, locale)}</td>
                <th scope="row">{contact}</th>
                <td>
                  {names[row.beneficiary_id] ?? labels.unknownPerson}
                  <span data-sub>{labels.roles[row.role]}</span>
                </td>
                <td>{labels.natures[row.nature]}</td>
                <td data-align="end">{formatCents(row.base, locale)}</td>
                <td data-align="end">{formatRate(row.rate, locale)}</td>
                <td data-align="end">{amount}</td>
                <td>
                  <StatusPill tone={toneOf(row.status)}>{labels.statuses[row.status]}</StatusPill>
                  {row.rejected_reason ? (
                    <span data-sub>
                      {labels.rejectedReason.replace("{reason}", row.rejected_reason)}
                    </span>
                  ) : null}
                </td>
                <td>
                  {row.payout_id === null
                    ? labels.noPayout
                    : payout
                      ? labels.inPayout
                          .replace("{start}", formatDay(payout.period_start, locale))
                          .replace("{end}", formatDay(payout.period_end, locale))
                      : labels.preparing}
                </td>
                {canApprove ? (
                  <td>
                    {row.status === "accrued" ? (
                      <RejectLineSheet
                        lineId={row.id}
                        name={contact}
                        amount={amount}
                        labels={labels.reject}
                        reject={reject}
                      />
                    ) : null}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </div>
  );
}
