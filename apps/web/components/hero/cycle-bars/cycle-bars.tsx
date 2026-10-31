import styles from './cycle-bars.module.css';

/**
 * The three bars under the hero object: the highlighted state of the phone, web, AI chip cycle
 * fills while it holds (home-v7 scene.js:371). Decoration without words, so hidden from assistive
 * technology. Static markup: the scene (`onProgress`) or the video (`currentTime`) writes `--p` on
 * each `<li>` from `lib/hero/bars.ts`; they only show while the stage is live (poster mode and
 * reduced motion have no cycle).
 */
export function CycleBars() {
  return (
    <ol className={styles.cycle} data-hero-bars aria-hidden="true">
      <li />
      <li />
      <li />
    </ol>
  );
}
