import { Heading } from "@/components/ui/Heading/Heading";
import type { BentoArea, BentoLinkData, NeedFigure, WayId } from "@/types/services";

import { BentoLink } from "../BentoTile/BentoLink";
import { BentoTile } from "../BentoTile/BentoTile";
import { NeedVisual } from "../NeedVisual/NeedVisual";
import { StackChips } from "../StackChips/StackChips";
import styles from "./NeedTile.module.css";

interface NeedTileProps {
  way: WayId;
  area: BentoArea;
  title: string;
  text: string;
  points: string[];
  figure: NeedFigure;
  chips: string[];
  cta: BentoLinkData;
  more?: BentoLinkData;
}

export function NeedTile({
  way,
  area,
  title,
  text,
  points,
  figure,
  chips,
  cta,
  more,
}: NeedTileProps) {
  const titleId = `${way}-title`;
  return (
    <BentoTile id={way} area={area} labelledBy={titleId}>
      <div className={styles.layout}>
        <div className={styles.head}>
          <Heading level={3} size="h4" id={titleId}>
            {title}
          </Heading>
          <p className={styles.text}>{text}</p>
        </div>
        <ul className={styles.points}>
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <div className={styles.visual}>
          <NeedVisual way={way} />
        </div>
        <div className={styles.foot}>
          <dl className={styles.figure}>
            <dt className={styles.caption}>{figure.caption}</dt>
            <dd className={styles.value}>
              {figure.prefix ? <span className={styles.unit}>{figure.prefix}</span> : null}
              <strong>{figure.value}</strong>
              <span className={styles.unit}>{figure.unit}</span>
              {figure.provisionalLabel ? (
                <span className={styles.tag} data-provisional="">
                  {figure.provisionalLabel}
                </span>
              ) : null}
            </dd>
          </dl>
          <div className={styles.chips}>
            <StackChips items={chips} />
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
      </div>
    </BentoTile>
  );
}
