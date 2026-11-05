import type { ReactNode } from "react";

import { Heading } from "@/components/ui/Heading/Heading";
import type { HeadingSize } from "@/types/ui";

import styles from "./PageHead.module.css";

interface PageHeadProps {
  title: string;
  titleSize?: HeadingSize;
  accent?: string;
  lead?: string;
  breadcrumbs?: ReactNode;
  children?: ReactNode;
}

export function PageHead({ title, titleSize, accent, lead, breadcrumbs, children }: PageHeadProps) {
  return (
    <header className={styles.head}>
      {breadcrumbs}
      <Heading level={1} size={titleSize} accent={accent}>
        {title}
      </Heading>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      {children}
    </header>
  );
}
