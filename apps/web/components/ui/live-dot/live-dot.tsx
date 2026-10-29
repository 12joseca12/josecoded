import styles from './live-dot.module.css';

/** The «alive» dot. Green is reserved for this, for checks and for the intro flash. Decorative. */
export function LiveDot() {
  return <span className={styles.dot} aria-hidden="true" />;
}
