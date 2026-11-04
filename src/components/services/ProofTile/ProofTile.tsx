import { Heading } from "@/components/ui/Heading/Heading";
import type { BentoLinkData } from "@/types/services";

import { BentoLink } from "../BentoTile/BentoLink";
import { BentoTile } from "../BentoTile/BentoTile";
import { StackChips } from "../StackChips/StackChips";
import styles from "./ProofTile.module.css";

interface ProofTileProps {
  title: string;
  text: string;
  chips: string[];
  cta: BentoLinkData;
  more: BentoLinkData;
}

const titleId = "proof-title";

export function ProofTile({ title, text, chips, cta, more }: ProofTileProps) {
  return (
    <BentoTile area="proof" tone="dark" labelledBy={titleId}>
      <div className={styles.layout}>
        <div className={styles.head}>
          <Heading level={3} size="h4" id={titleId}>
            {title}
          </Heading>
          <p className={styles.text}>{text}</p>
        </div>
        <StackChips items={chips} tone="dark" />
        <div className={styles.actions}>
          <BentoLink href={cta.href} describedBy={titleId}>
            {cta.label}
          </BentoLink>
          <BentoLink href={more.href} variant="inline">
            {more.label}
          </BentoLink>
        </div>
      </div>
    </BentoTile>
  );
}
