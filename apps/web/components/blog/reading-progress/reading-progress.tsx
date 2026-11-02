import styles from './reading-progress.module.css';

/**
 * Thin bar at the top of the viewport that fills as the guide is read. Pure CSS: it is driven by the root scroll
 * (`animation-timeline: scroll()`), so it ships no JavaScript. Without scroll-driven animations, or with reduced
 * motion, it is not drawn at all (working-agreements §6): the table of contents and the scrollbar already tell where
 * the visitor is.
 *
 * A11y: decoration only, `aria-hidden`; it holds no information that the page does not give another way and is never
 * focusable.
 */
export function ReadingProgress() {
  return <div className={styles.bar} aria-hidden="true" />;
}
