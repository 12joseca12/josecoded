import styles from './backdrop.module.css';

/**
 * Light field (three blended beams and a pool) plus film grain, fixed behind the content.
 *
 * Still by default: every page except the home shows it at its rest position. On the home the glyph
 * scene (task 2.8) finds `[data-backdrop-field]` and drives its `transform` from the object and the
 * cursor; nothing here runs in JavaScript. Decorative, so hidden from assistive technology.
 */
export function Backdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <div className={styles.field} data-backdrop-field>
        <div className={styles.pool} />
        <i className={styles.beam} data-beam="3" />
        <i className={styles.beam} data-beam="1" />
        <i className={styles.beam} data-beam="2" />
      </div>
      <div className={styles.grain} />
    </div>
  );
}
