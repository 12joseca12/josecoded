import Link from "next/link";

import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import type { CounterCellData } from "@/types/overview";

import styles from "./CounterCell.module.css";

const dash = "—";

interface CounterCellProps {
  cell: CounterCellData;
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
    <li className={styles.cell} data-state={state}>
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
