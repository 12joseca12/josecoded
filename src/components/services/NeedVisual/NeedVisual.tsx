import type { WayId } from "@/types/services";

import styles from "./NeedVisual.module.css";

interface NeedVisualProps {
  way: WayId;
}

const teamRows = ["a", "b", "you"] as const;
const diffRows = ["context", "removed", "added", "added", "context", "added"] as const;

export function NeedVisual({ way }: NeedVisualProps) {
  return (
    <div className={styles.scene} data-way={way} aria-hidden="true">
      {way === "contratacion" ? (
        <div className={styles.team}>
          {teamRows.map((row) => (
            <div key={row} className={styles.member} data-row={row}>
              <span className={styles.avatar} />
              <span className={styles.bar} />
              <span className={styles.badge} />
            </div>
          ))}
        </div>
      ) : null}
      {way === "packs" ? (
        <div className={styles.devices}>
          <div className={styles.window}>
            <span className={styles.dots} />
            <span className={styles.hero} />
            <span className={styles.line} />
            <span className={styles.line} />
          </div>
          <div className={styles.phone}>
            <span className={styles.notch} />
            <span className={styles.screen} />
            <span className={styles.line} />
            <span className={styles.line} />
          </div>
        </div>
      ) : null}
      {way === "freelance" ? (
        <div className={styles.diff}>
          {diffRows.map((kind, index) => (
            <div key={`${kind}-${index}`} className={styles.row} data-kind={kind}>
              <span className={styles.gutter} />
              <span className={styles.code} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
