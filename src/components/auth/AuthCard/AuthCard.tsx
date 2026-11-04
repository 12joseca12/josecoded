import type { ReactNode, Ref } from "react";

import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";

import styles from "./AuthCard.module.css";

interface AuthCardProps {
  title: string;
  lead?: string;
  headRef?: Ref<HTMLElement>;
  children: ReactNode;
}

export function AuthCard({ title, lead, headRef, children }: AuthCardProps) {
  return (
    <div className={styles.page}>
      <Card tone="panel" size="lg" className={styles.card}>
        <header ref={headRef} tabIndex={headRef ? -1 : undefined} className={styles.head}>
          <Heading level={1} size="h2">
            {title}
          </Heading>
          {lead ? <p className={styles.lead}>{lead}</p> : null}
        </header>
        {children}
      </Card>
    </div>
  );
}
