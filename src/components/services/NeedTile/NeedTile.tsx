import type { ReactNode } from "react";

import { Heading } from "@/components/ui/Heading/Heading";
import type { BentoArea, BentoLinkData, WayId } from "@/types/services";

import { BentoLink } from "../BentoTile/BentoLink";
import { BentoTile } from "../BentoTile/BentoTile";
import { NeedVisual } from "../NeedVisual/NeedVisual";
import styles from "./NeedTile.module.css";

interface NeedTileProps {
  way: WayId;
  area: BentoArea;
  title: string;
  text: string;
  cta: BentoLinkData;
  more?: BentoLinkData;
  price?: ReactNode;
}

export function NeedTile({ way, area, title, text, cta, more, price }: NeedTileProps) {
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
          {price ? <p className={styles.price}>{price}</p> : null}
        </div>
        <div className={styles.actions}>
          <BentoLink href={cta.href} describedBy={titleId}>
            {cta.label}
          </BentoLink>
          {more ? (
            <BentoLink href={more.href} variant="inline">
              {more.label}
            </BentoLink>
          ) : null}
        </div>
      </div>
    </BentoTile>
  );
}
