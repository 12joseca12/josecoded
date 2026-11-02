import { Chip } from '@/components/ui/chip';

import styles from './stack-groups.module.css';

export interface StackGroup {
  id: string;
  title: string;
  items: readonly string[];
}

/**
 * The stack in blocks (mobile, web, backend and data, quality and operations): chips in a group, no
 * marquee, no logos of third parties. A group with no items is not drawn.
 *
 * A11y: each group is a labelled list; the chips are plain text items.
 */
export function StackGroups({ groups }: { groups: readonly StackGroup[] }) {
  return (
    <div className={styles.groups}>
      {groups
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.id} className={styles.group} aria-labelledby={`stack-${group.id}`}>
            <h3 id={`stack-${group.id}`} className={styles.title}>
              {group.title}
            </h3>
            <ul className={styles.items}>
              {group.items.map((item) => (
                <li key={item}>
                  <Chip>{item}</Chip>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
