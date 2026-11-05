import type { ReactNode } from "react";

import styles from "./DataTable.module.css";

interface DataTableProps {
  caption: string;
  region: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function DataTable({ caption, region, size = "md", children }: DataTableProps) {
  return (
    <div className={styles.region} role="group" aria-label={region} tabIndex={0}>
      <table className={styles.table} data-size={size}>
        <caption className={styles.caption}>{caption}</caption>
        {children}
      </table>
    </div>
  );
}
