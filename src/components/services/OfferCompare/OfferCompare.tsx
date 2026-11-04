"use client";

import { type KeyboardEvent, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import type { OfferTabGroup } from "@/types/services";

import styles from "./OfferCompare.module.css";

interface OfferCompareLabels {
  tabs: string;
  from: string;
  unit: string;
  price: string;
  audience: string;
  includes: string;
  excludes: string;
  delivery: string;
  provisional: string;
}

interface OfferCompareProps {
  labels: OfferCompareLabels;
  groups: OfferTabGroup[];
}

export function OfferCompare({ labels, groups }: OfferCompareProps) {
  const id = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (index: number) => {
    setActive(index);
    tabs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = groups.length - 1;
    if (event.key === "ArrowRight") move(index === last ? 0 : index + 1);
    else if (event.key === "ArrowLeft") move(index === 0 ? last : index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(last);
    else return;
    event.preventDefault();
  };

  return (
    <div className={styles.compare}>
      <div className={styles.tablist} role="tablist" aria-label={labels.tabs}>
        {groups.map((group, index) => (
          <button
            key={group.id}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${group.id}`}
            aria-selected={index === active}
            aria-controls={`${id}-panel-${group.id}`}
            tabIndex={index === active ? 0 : -1}
            className={styles.tab}
            onClick={() => {
              setActive(index);
            }}
            onKeyDown={(event) => {
              onKeyDown(event, index);
            }}
          >
            {group.label}
          </button>
        ))}
      </div>
      {groups.map((group, index) => (
        <div
          key={group.id}
          role="tabpanel"
          id={`${id}-panel-${group.id}`}
          aria-labelledby={`${id}-tab-${group.id}`}
          hidden={index !== active}
          className={styles.panel}
          data-platform={group.id}
        >
          <ul className={styles.list} data-count={group.items.length}>
            {group.items.map((item) => (
              <li key={item.slug} className={styles.entry}>
                <Card
                  as="article"
                  className={styles.offer}
                  data-offer={item.slug}
                  data-status={item.provisional ? "provisional" : "final"}
                >
                  <Heading level={3} size="h4">
                    {item.name}
                  </Heading>
                  <p className={styles.text}>{item.audience}</p>
                  <p className={styles.price}>
                    <span className={styles.term}>
                      {labels.price}
                      {item.provisional ? (
                        <span className={styles.tag} data-provisional="">
                          {labels.provisional}
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.value}>
                      <span className={styles.unit}>{labels.from}</span>
                      <strong>{item.price}</strong>
                      <span className={styles.unit}>{labels.unit}</span>
                    </span>
                  </p>
                  <p className={styles.delivery}>
                    <span className={styles.term}>{labels.delivery}</span>
                    <span>{item.weeks}</span>
                  </p>
                  <p className={styles.includes}>{labels.includes}</p>
                  <ul className={styles.bullets}>
                    {item.includes.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <p className={styles.includes}>{labels.excludes}</p>
                  <ul className={styles.bullets} data-tone="muted">
                    {item.excludes.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <Button href={item.ctaHref} icon={<ArrowIcon />}>
                    {item.ctaLabel}
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
