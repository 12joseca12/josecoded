import type { ReactNode } from "react";

import type { BentoArea, BentoTone } from "@/types/services";

import styles from "./BentoTile.module.css";

interface BentoTileProps {
  id?: string;
  area: BentoArea;
  tone?: BentoTone;
  labelledBy: string;
  children: ReactNode;
}

export function BentoTile({ id, area, tone = "need", labelledBy, children }: BentoTileProps) {
  return (
    <article
      id={id}
      className={styles.tile}
      data-area={area}
      data-tone={tone}
      aria-labelledby={labelledBy}
    >
      {children}
    </article>
  );
}
