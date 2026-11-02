import styles from './toc.module.css';

export interface TocItem {
  id: string;
  label: string;
}

/**
 * Index of a long page: one link per section, to its anchor. Server component (plain anchors).
 *
 * A11y: a `nav` with its own name; an ordered list; every link has a visible focus ring.
 */
export function Toc({ label, items }: { label: string; items: readonly TocItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={label} className={styles.toc}>
      <p className={styles.label} aria-hidden="true">
        {label}
      </p>
      <ol className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={styles.link}>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
