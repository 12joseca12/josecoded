import type { ReactNode } from "react";

import { Heading } from "@/components/ui/Heading/Heading";

import styles from "./AccountCard.module.css";

interface AccountCardProps {
  id: string;
  title: string;
  lead?: string;
  children: ReactNode;
}

export function AccountCard({ id, title, lead, children }: AccountCardProps) {
  const titleId = `${id}-title`;
  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <header className={styles.head}>
        <Heading level={2} size="h4" id={titleId}>
          {title}
        </Heading>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
      </header>
      {children}
    </section>
  );
}
