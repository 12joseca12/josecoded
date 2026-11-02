import type { ReactNode } from "react";

import { Heading } from "@/components/ui/Heading/Heading";
import type { WayId } from "@/types/services";

import styles from "./WaySection.module.css";

interface WaySectionProps {
  id: WayId;
  title: string;
  text: string;
  audienceLabel: string;
  audience: string;
  bullets: string[];
  extra?: ReactNode;
  actions: ReactNode;
}

export function WaySection({
  id,
  title,
  text,
  audienceLabel,
  audience,
  bullets,
  extra,
  actions,
}: WaySectionProps) {
  const headingId = `${id}-title`;
  return (
    <section id={id} data-block className={styles.way} aria-labelledby={headingId}>
      <div className={styles.body}>
        <Heading level={2} id={headingId}>
          {title}
        </Heading>
        <p className={styles.text}>{text}</p>
        <p className={styles.audience}>
          <strong>{audienceLabel}</strong> {audience}
        </p>
        <ul className={styles.bullets}>
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        {extra}
        <div className={styles.actions}>{actions}</div>
      </div>
    </section>
  );
}
