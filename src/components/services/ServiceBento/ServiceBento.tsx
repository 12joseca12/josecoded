import type { ReactNode } from "react";

import type { BentoLayout } from "@/types/services";

import styles from "./ServiceBento.module.css";

interface ServiceBentoProps {
  layout?: BentoLayout;
  children: ReactNode;
}

export function ServiceBento({ layout = "hub", children }: ServiceBentoProps) {
  return (
    <div className={styles.bento}>
      <div className={styles.grid} data-layout={layout}>
        {children}
      </div>
    </div>
  );
}
