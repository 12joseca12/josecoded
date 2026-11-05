import NextLink from "next/link";

import styles from "./PrevNext.module.css";

interface PrevNextItem {
  title: string;
  href: string;
}

interface PrevNextProps {
  label: string;
  prevLabel: string;
  nextLabel: string;
  prev: PrevNextItem | null;
  next: PrevNextItem | null;
}

export function PrevNext({ label, prevLabel, nextLabel, prev, next }: PrevNextProps) {
  if (!prev && !next) return null;
  return (
    <nav aria-label={label} className={styles.nav}>
      {prev ? (
        <NextLink href={prev.href} rel="prev" className={styles.link} data-side="prev">
          <span className={styles.hint}>{prevLabel}</span>
          <span className={styles.title}>{prev.title}</span>
        </NextLink>
      ) : null}
      {next ? (
        <NextLink href={next.href} rel="next" className={styles.link} data-side="next">
          <span className={styles.hint}>{nextLabel}</span>
          <span className={styles.title}>{next.title}</span>
        </NextLink>
      ) : null}
    </nav>
  );
}
