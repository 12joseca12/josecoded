import NextLink from "next/link";

import type { PaginationData } from "@/types/blog";

import styles from "./Pagination.module.css";

interface PaginationProps {
  data: PaginationData;
}

export function Pagination({ data }: PaginationProps) {
  return (
    <nav className={styles.pagination} aria-label={data.label}>
      {data.previous ? (
        <NextLink href={data.previous.href} className={styles.step} rel="prev">
          {data.previous.label}
        </NextLink>
      ) : (
        <span className={styles.step} aria-disabled="true">
          {data.previousLabel}
        </span>
      )}
      <p className={styles.status}>{data.status}</p>
      {data.next ? (
        <NextLink href={data.next.href} className={styles.step} rel="next">
          {data.next.label}
        </NextLink>
      ) : (
        <span className={styles.step} aria-disabled="true">
          {data.nextLabel}
        </span>
      )}
    </nav>
  );
}
