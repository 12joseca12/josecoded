import { Heading } from "@/components/ui/Heading/Heading";

import styles from "./PageHead.module.css";

interface PageHeadProps {
  title: string;
  accent?: string;
  lead?: string;
}

export function PageHead({ title, accent, lead }: PageHeadProps) {
  return (
    <header className={styles.head}>
      <Heading level={1} accent={accent}>
        {title}
      </Heading>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
    </header>
  );
}
