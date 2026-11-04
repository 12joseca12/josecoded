import type { WayId } from "@/types/services";

import styles from "./NeedVisual.module.css";

interface NeedVisualProps {
  way: WayId;
}

export function NeedVisual({ way }: NeedVisualProps) {
  return (
    <span className={styles.badge} data-way={way} aria-hidden="true">
      <svg viewBox="0 0 48 48" className={styles.glyph} focusable="false">
        {way === "contratacion" ? (
          <>
            <circle cx="14" cy="19" r="5" className={styles.line} />
            <path d="M5 38c0-5 4-8.5 9-8.5" className={styles.line} />
            <circle cx="34" cy="19" r="5" className={styles.line} />
            <path d="M43 38c0-5-4-8.5-9-8.5" className={styles.line} />
            <circle cx="24" cy="15" r="6" className={styles.fill} />
            <path d="M13 41c0-6.5 5-10.5 11-10.5S35 34.5 35 41Z" className={styles.fill} />
          </>
        ) : null}
        {way === "project" ? (
          <>
            <rect x="4" y="9" width="30" height="24" rx="3" className={styles.line} />
            <path d="M4 16h30" className={styles.line} />
            <rect x="26" y="19" width="16" height="24" rx="3.5" className={styles.fill} />
            <path d="M31 24h6" className={styles.cut} />
          </>
        ) : null}
        {way === "freelance" ? (
          <>
            <path d="M16 14 6 24l10 10" className={styles.line} />
            <path d="m32 14 10 10-10 10" className={styles.line} />
            <path d="m27 10-6 28" className={styles.accent} />
          </>
        ) : null}
      </svg>
    </span>
  );
}
