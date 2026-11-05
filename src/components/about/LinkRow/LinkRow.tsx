import { Link } from "@/components/ui/Link/Link";
import type { ProfileLinkRow } from "@/types/about";

import styles from "./LinkRow.module.css";

interface LinkRowProps {
  label: string;
  newTabLabel: string;
  items: ProfileLinkRow[];
}

export function LinkRow({ label, newTabLabel, items }: LinkRowProps) {
  return (
    <nav aria-label={label}>
      <ul className={styles.row}>
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} external rel="me" newTabLabel={newTabLabel} variant="arrow">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
