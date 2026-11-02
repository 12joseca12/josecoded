import NextLink from "next/link";

import styles from "./Brand.module.css";

interface BrandProps {
  href: string;
  label: string;
  word: string;
  collapsed?: boolean;
}

export function Brand({ href, label, word, collapsed = false }: BrandProps) {
  return (
    <NextLink
      href={href}
      className={styles.brand}
      aria-label={label}
      data-collapsed={collapsed || undefined}
    >
      <svg className={styles.mark} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect className={styles.markBg} x="1" y="1" width="22" height="22" rx="11" />
        <circle className={styles.markDot} cx="16.5" cy="7.5" r="3" />
        <path className={styles.markJ} d="M8 9.5v5.5a2 2 0 0 1-3 1.7" />
      </svg>
      <span className={styles.word}>{word}</span>
    </NextLink>
  );
}
