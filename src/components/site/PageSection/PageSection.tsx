import type { ReactNode } from "react";

import { Heading } from "@/components/ui/Heading/Heading";
import type { PageSectionSize } from "@/types/ui";

import styles from "./PageSection.module.css";

interface PageSectionProps {
  id: string;
  title: string;
  lead?: string;
  size?: PageSectionSize;
  children?: ReactNode;
}

export function PageSection({ id, title, lead, size = "narrow", children }: PageSectionProps) {
  const headingId = `${id}-title`;
  return (
    <section id={id} data-block className={styles.section} aria-labelledby={headingId}>
      <div className={styles.body} data-size={size}>
        <Heading level={2} id={headingId}>
          {title}
        </Heading>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}
