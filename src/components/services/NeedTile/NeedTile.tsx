import { Heading } from "@/components/ui/Heading/Heading";
import type { BentoArea, BentoLinkData, WayId } from "@/types/services";

import { BentoLink } from "../BentoTile/BentoLink";
import { BentoTile } from "../BentoTile/BentoTile";
import { ExpectationLine } from "../ExpectationLine/ExpectationLine";
import { NeedVisual } from "../NeedVisual/NeedVisual";
import styles from "./NeedTile.module.css";

interface NeedTileProps {
  way: WayId;
  area: BentoArea;
  title: string;
  text: string;
  cta: BentoLinkData;
  more?: BentoLinkData[];
  expectation?: { label: string; text: string };
}

export function NeedTile({ way, area, title, text, cta, more = [], expectation }: NeedTileProps) {
  const titleId = `${way}-title`;
  return (
    <BentoTile id={way} area={area} labelledBy={titleId}>
      <div className={styles.layout}>
        <NeedVisual way={way} />
        <div className={styles.head}>
          <Heading level={3} size="h4" id={titleId}>
            {title}
          </Heading>
          <p className={styles.text}>{text}</p>
          {expectation ? (
            <ExpectationLine label={expectation.label}>{expectation.text}</ExpectationLine>
          ) : null}
        </div>
        <div className={styles.actions}>
          <BentoLink href={cta.href} describedBy={titleId} download={cta.download} lang={cta.lang}>
            {cta.label}
          </BentoLink>
          {more.map((link) => (
            <BentoLink
              key={link.href}
              href={link.href}
              variant="inline"
              download={link.download}
              lang={link.lang}
            >
              {link.label}
            </BentoLink>
          ))}
        </div>
      </div>
    </BentoTile>
  );
}
