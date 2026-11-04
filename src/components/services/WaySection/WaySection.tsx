import type { ReactNode } from "react";

import { PageSection } from "@/components/site/PageSection/PageSection";
import type { WayId } from "@/types/services";

import styles from "./WaySection.module.css";

interface WaySectionProps {
  id: WayId;
  title: string;
  text: string;
  actions: ReactNode;
}

export function WaySection({ id, title, text, actions }: WaySectionProps) {
  return (
    <PageSection id={id} title={title}>
      <p className={styles.text}>{text}</p>
      <div className={styles.actions}>{actions}</div>
    </PageSection>
  );
}
