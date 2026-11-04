import { Heading } from "@/components/ui/Heading/Heading";
import type { BentoLinkData, PhaseChip } from "@/types/services";

import { BentoLink } from "../BentoTile/BentoLink";
import { BentoTile } from "../BentoTile/BentoTile";
import styles from "./PhasesTile.module.css";

interface PhasesTileProps {
  title: string;
  text: string;
  phases: PhaseChip[];
  cta: BentoLinkData;
}

const titleId = "phases-title";

export function PhasesTile({ title, text, phases, cta }: PhasesTileProps) {
  return (
    <BentoTile area="phases" tone="quiet" labelledBy={titleId}>
      <div className={styles.layout}>
        <div className={styles.head}>
          <Heading level={3} size="h4" id={titleId}>
            {title}
          </Heading>
          <p className={styles.text}>{text}</p>
        </div>
        <ol className={styles.strip}>
          {phases.map((phase) => (
            <li key={phase.id} className={styles.phase}>
              {phase.label}
            </li>
          ))}
        </ol>
        <BentoLink href={cta.href} describedBy={titleId}>
          {cta.label}
        </BentoLink>
      </div>
    </BentoTile>
  );
}
