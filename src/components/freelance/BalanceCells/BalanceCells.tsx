import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";

import styles from "./BalanceCells.module.css";

export interface BalanceCell {
  key: string;
  label: string;
  value: string | null;
  highlight?: boolean;
}

interface BalanceCellsProps {
  cells: BalanceCell[];
  unknownLabel: string;
  label: string;
}

const dash = "—";

export function BalanceCells({ cells, unknownLabel, label }: BalanceCellsProps) {
  return (
    <ul className={styles.cells} aria-label={label}>
      {cells.map((cell) => (
        <li
          key={cell.key}
          className={styles.cell}
          data-state={cell.value === null ? "unknown" : "known"}
          data-highlight={cell.highlight === true ? "true" : undefined}
        >
          <span className={styles.label}>{cell.label}</span>
          <span className={styles.value}>
            {cell.value ?? (
              <>
                <span aria-hidden="true">{dash}</span>
                <VisuallyHidden>{unknownLabel}</VisuallyHidden>
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
