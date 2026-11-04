import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";

import styles from "./ChannelCard.module.css";

interface ChannelCardProps {
  id?: string;
  title: string;
  hint: string;
  children: ReactNode;
}

export function ChannelCard({ id, title, hint, children }: ChannelCardProps) {
  return (
    <Card as="li" id={id} size="lg" className={styles.card}>
      <Heading level={2} size="h4">
        {title}
      </Heading>
      <p className={styles.hint}>{hint}</p>
      <div className={styles.action}>{children}</div>
    </Card>
  );
}
