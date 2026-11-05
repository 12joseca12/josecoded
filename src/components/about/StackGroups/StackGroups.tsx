import { Heading } from "@/components/ui/Heading/Heading";
import type { StackGroupBlock } from "@/types/about";

import styles from "./StackGroups.module.css";

interface StackGroupsProps {
  groups: StackGroupBlock[];
}

export function StackGroups({ groups }: StackGroupsProps) {
  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section key={group.id} className={styles.group} aria-labelledby={`stack-${group.id}`}>
          <Heading level={3} size="h4" id={`stack-${group.id}`}>
            {group.title}
          </Heading>
          <ul className={styles.items} aria-label={group.listLabel}>
            {group.items.map((item) => (
              <li key={item.name} className={styles.item}>
                <span className={styles.name}>{item.name}</span>
                {item.detail ? <span className={styles.detail}>{item.detail}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
