import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import type { NeedFromYouItem } from "@/types/services";

import styles from "./WhatINeedFromYou.module.css";

interface WhatINeedFromYouProps {
  items: NeedFromYouItem[];
}

export function WhatINeedFromYou({ items }: WhatINeedFromYouProps) {
  return (
    <ul className={styles.list} data-count={items.length}>
      {items.map((item) => (
        <li key={item.slug} className={styles.entry}>
          <Card as="article" size="sm" className={styles.tier} data-need={item.slug}>
            <Heading level={3} size="h4">
              {item.name}
            </Heading>
            <ul className={styles.bullets}>
              {item.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </Card>
        </li>
      ))}
    </ul>
  );
}
