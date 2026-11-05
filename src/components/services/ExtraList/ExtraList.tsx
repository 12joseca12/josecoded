"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { ChevronIcon } from "@/components/ui/icons/ChevronIcon";
import { extraAppliesTo, extraOf, type ExtraSlug } from "@/lib/services/offers";
import { recommend } from "@/lib/services/recommender";
import { completeAnswers, parseState } from "@/lib/services/recommender-url";
import { recommenderUrlEvent } from "@/lib/services/recommender-url-event";
import type { ExtraChipItem } from "@/types/services";

import styles from "./ExtraList.module.css";

interface ExtraListProps {
  action: string;
  legend: string;
  cta: string;
  hint: string;
  showAll: string;
  items: ExtraChipItem[];
  initialQuery?: string;
}

function activeOffersOf(query: string | undefined) {
  const answers = completeAnswers(parseState(query, undefined).draft);
  const outcome = answers ? recommend(answers) : null;
  return outcome?.route === "project" ? outcome.offers : null;
}

export function ExtraList({
  action,
  legend,
  cta,
  hint,
  showAll,
  items,
  initialQuery,
}: ExtraListProps) {
  const [query, setQuery] = useState(initialQuery);
  const [chosen, setChosen] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      setQuery(new URLSearchParams(window.location.search).get("q") ?? undefined);
    };
    window.addEventListener(recommenderUrlEvent, sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener(recommenderUrlEvent, sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  const activeOffers = activeOffersOf(query);
  const isActive = (item: ExtraChipItem) =>
    activeOffers === null || extraAppliesTo(extraOf(item.slug as ExtraSlug), activeOffers);
  const first = items.filter(isActive);
  const rest = items.filter((item) => !isActive(item));
  const renderItem = (item: ExtraChipItem) => (
    <li key={item.slug} className={styles.entry}>
      <input
        id={`extra-${item.slug}`}
        className={styles.input}
        type="checkbox"
        name="extras"
        value={item.slug}
        checked={chosen.includes(item.slug)}
        onChange={(event) => {
          const { checked } = event.currentTarget;
          setChosen((current) =>
            checked ? [...current, item.slug] : current.filter((slug) => slug !== item.slug),
          );
        }}
        aria-describedby={`extra-${item.slug}-text extra-${item.slug}-who`}
      />
      <label htmlFor={`extra-${item.slug}`} className={styles.chip} data-extra={item.slug}>
        <span className={styles.name}>{item.name}</span>
        <span id={`extra-${item.slug}-text`} className={styles.text}>
          {item.text}
        </span>
        <span id={`extra-${item.slug}-who`} className={styles.who}>
          {item.forWho}
        </span>
        <span className={styles.meta}>
          {item.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
          <span className={styles.included}>{item.included}</span>
        </span>
      </label>
    </li>
  );
  return (
    <form method="get" action={action} className={styles.form}>
      <input type="hidden" name="via" value="project" />
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{legend}</legend>
        <ul className={styles.list}>{first.map(renderItem)}</ul>
        {rest.length > 0 ? (
          <details className={styles.more}>
            <summary className={styles.summary}>
              <span>{showAll}</span>
              <span className={styles.marker}>
                <ChevronIcon />
              </span>
            </summary>
            <ul className={styles.list}>{rest.map(renderItem)}</ul>
          </details>
        ) : null}
      </fieldset>
      <div className={styles.actions}>
        <Button type="submit" icon={<ArrowIcon />}>
          {cta}
        </Button>
        <p className={styles.hint}>{hint}</p>
      </div>
    </form>
  );
}
