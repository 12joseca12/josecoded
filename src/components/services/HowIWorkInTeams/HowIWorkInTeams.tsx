import { Link } from "@/components/ui/Link/Link";
import type { BentoLinkData, TeamPracticeItem } from "@/types/services";

import styles from "./HowIWorkInTeams.module.css";

interface HowIWorkInTeamsProps {
  label: string;
  items: TeamPracticeItem[];
  more: BentoLinkData;
}

export function HowIWorkInTeams({ label, items, more }: HowIWorkInTeamsProps) {
  return (
    <div className={styles.root}>
      <ul className={styles.list} aria-label={label}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            {item.text}
          </li>
        ))}
      </ul>
      <Link href={more.href} variant="arrow">
        {more.label}
      </Link>
    </div>
  );
}
