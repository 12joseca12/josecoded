import { Button } from "@/components/ui/Button/Button";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";

import styles from "./StoreLinks.module.css";

interface StoreLinksProps {
  label: string;
  newTab: string;
  items: { id: string; label: string; href: string }[];
}

export function StoreLinks({ label, newTab, items }: StoreLinksProps) {
  if (items.length === 0) return null;
  return (
    <ul className={styles.links} aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>
          <Button
            href={item.href}
            variant="light"
            target="_blank"
            rel="noopener noreferrer"
            data-link={item.id}
          >
            {item.label}
            <VisuallyHidden> {newTab}</VisuallyHidden>
          </Button>
        </li>
      ))}
    </ul>
  );
}
