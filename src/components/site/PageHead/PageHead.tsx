import type { ReactNode } from "react";

import { Heading } from "@/components/ui/Heading/Heading";

import styles from "./PageHead.module.css";

interface PageHeadProps {
  title: string;
  accent?: string;
  lead?: string;
  breadcrumbs?: ReactNode;
  children?: ReactNode;
}

export function PageHead({ title, accent, lead, breadcrumbs, children }: PageHeadProps) {
  return (
    <header className={styles.head}>
      {breadcrumbs}
      <Heading level={1} accent={accent}>
        {title}
      </Heading>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      {children}
    </header>
  );
}
