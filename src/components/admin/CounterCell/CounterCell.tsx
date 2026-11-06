import Link from "next/link";

import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";

import styles from "./CounterCell.module.css";

const dash = "—";

export interface CounterCellView {
  label: string;
  value: number | string | null;
  amount?: string | null;
  href?: string | null;
  highlight?: boolean;
}

interface CounterCellProps {
  cell: CounterCellView;
  unknownLabel: string;
}

export function CounterCell({ cell, unknownLabel }: CounterCellProps) {
  const known = cell.value !== null;
  const state = !known ? "unknown" : cell.value === 0 ? "empty" : "filled";
  const body = (
    <>
      <span className={styles.label}>{cell.label}</span>
      <span className={styles.value}>
        {known ? (
          cell.value
        ) : (
          <>
            <span aria-hidden="true">{dash}</span>
            <VisuallyHidden>{unknownLabel}</VisuallyHidden>
          </>
        )}
      </span>
      {cell.amount ? <span className={styles.amount}>{cell.amount}</span> : null}
    </>
  );
  return (
    <li
      className={styles.cell}
      data-state={state}
      data-kind={typeof cell.value === "string" ? "text" : "count"}
      data-highlight={cell.highlight === true ? "true" : undefined}
    >
      {cell.href ? (
        <Link href={cell.href} className={styles.link}>
          {body}
        </Link>
      ) : (
        <div className={styles.link}>{body}</div>
      )}
    </li>
  );
}
