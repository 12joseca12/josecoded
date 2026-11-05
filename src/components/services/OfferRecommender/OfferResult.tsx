import type { MouseEvent, Ref } from "react";

import { ShareLink } from "@/components/services/ShareLink/ShareLink";
import { Button } from "@/components/ui/Button/Button";
import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { buildContactHref } from "@/lib/contact/ways";
import { type ExtraSlug, offerOf, priceOf } from "@/lib/services/offers";
import { type ProjectRecommendation, recommend, selectedExtras } from "@/lib/services/recommender";
import {
  completeAnswers,
  encodeState,
  type RecommenderState,
  toSearch,
} from "@/lib/services/recommender-url";

import type { RecommenderCopy } from "./copy";
import styles from "./OfferResult.module.css";

interface OfferResultProps {
  ref?: Ref<HTMLDivElement>;
  locale: string;
  copy: RecommenderCopy;
  state: RecommenderState;
  basePath: string;
  reviewHref: string;
  onReview: (event: MouseEvent<HTMLElement>) => void;
  onExtras: (selected: ExtraSlug[]) => void;
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}

export function OfferResult({
  ref,
  locale,
  copy,
  state,
  basePath,
  reviewHref,
  onReview,
  onExtras,
}: OfferResultProps) {
  const answers = completeAnswers(state.draft);
  const recommendation = answers ? recommend(answers) : null;
  const { result } = copy;

  if (!recommendation) return null;

  if (recommendation.route === "freelance") {
    return (
      <div ref={ref} tabIndex={-1} className={styles.result} data-route="freelance">
        <Card className={styles.card}>
          <Heading level={3} size="h3">
            {result.freelanceTitle}
          </Heading>
          <p className={styles.lead}>{result.freelanceText}</p>
          <div className={styles.actions}>
            <Button href={`/${locale}/servicios/freelance`} icon={<ArrowIcon />}>
              {result.freelanceCta}
            </Button>
            <Button
              href={buildContactHref(locale, "freelance")}
              variant="ghost"
              icon={<ArrowIcon />}
            >
              {result.freelanceContact}
            </Button>
            <Button variant="quiet" href={reviewHref} onClick={onReview}>
              {result.change}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ProjectResult
      ref={ref}
      locale={locale}
      copy={copy}
      recommendation={recommendation}
      state={state}
      basePath={basePath}
      reviewHref={reviewHref}
      onReview={onReview}
      onExtras={onExtras}
    />
  );
}

interface ProjectResultProps extends Omit<OfferResultProps, "state"> {
  recommendation: ProjectRecommendation;
  state: RecommenderState;
}

function ProjectResult({
  ref,
  locale,
  copy,
  recommendation,
  state,
  basePath,
  reviewHref,
  onReview,
  onExtras,
}: ProjectResultProps) {
  const { result } = copy;
  const selected = selectedExtras(recommendation, state.extras);
  const price = priceOf(recommendation.offers, selected);
  const hasMonthly = selected.includes("maintenance");
  const reasons = recommendation.reasons.map((reason) => {
    const template = copy.reasons[reason.id] ?? "";
    return {
      key: `${reason.id}-${reason.extra ?? ""}`,
      text: reason.extra ? fill(template, { extra: copy.extras[reason.extra].name }) : template,
    };
  });
  const assumed = recommendation.assumed.kind || recommendation.assumed.size;
  const assumptions = [
    recommendation.assumed.kind
      ? fill(result.assumedKind, {
          kind: [...new Set(recommendation.offers.map((slug) => copy.offers[slug].platform))].join(
            " + ",
          ),
        })
      : null,
    recommendation.assumed.size ? result.assumedSize : null,
  ].filter((line): line is string => line !== null);
  const shareSearch = toSearch(state);
  const shareHref = `${basePath}${shareSearch ? `?${shareSearch}` : ""}#recomendador`;
  const contact = buildContactHref(locale, "project", {
    offers: recommendation.offers,
    extras: selected,
  });
  const toggle = (slug: ExtraSlug, checked: boolean) => {
    onExtras(
      recommendation.available.filter((entry) =>
        entry === slug ? checked : selected.includes(entry),
      ),
    );
  };

  return (
    <div ref={ref} tabIndex={-1} className={styles.result} data-route="project">
      <Card className={styles.card}>
        <p className={styles.kicker}>{result.kicker}</p>
        <ul className={styles.offers}>
          {recommendation.offers.map((slug) => {
            const offer = offerOf(slug);
            return (
              <li key={slug} className={styles.offer} data-offer={slug}>
                <span className={styles.platform}>{copy.offers[slug].platform}</span>
                <Heading level={3} size="h3">
                  {copy.offers[slug].name}
                </Heading>
                <p className={styles.weeks}>
                  {fill(result.weeks, {
                    min: String(offer.weeksMin),
                    max: String(offer.weeksMax),
                  })}
                </p>
              </li>
            );
          })}
        </ul>
        <p
          className={styles.price}
          aria-live="polite"
          aria-atomic="true"
          data-testid="result-price"
        >
          <span className={styles.unit}>{result.from}</span>
          <strong>{price.once}</strong>
          <span className={styles.unit}>{result.unit}</span>
          {price.provisional ? (
            <span className={styles.tag} data-provisional="">
              {result.provisional}
            </span>
          ) : null}
          {hasMonthly ? (
            <span className={styles.monthly}>
              {fill(result.monthly, { amount: price.monthly })}
            </span>
          ) : null}
        </p>
        {assumed ? (
          <div className={styles.assumed} role="note">
            <strong>{result.assumedTitle}</strong>
            <span>{result.assumedText}</span>
            <ul className={styles.assumptions}>
              {assumptions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <section aria-labelledby="result-why" className={styles.block}>
          <Heading level={4} size="h4" id="result-why">
            {result.whyTitle}
          </Heading>
          <ul className={styles.reasons}>
            {reasons.map((reason) => (
              <li key={reason.key}>{reason.text}</li>
            ))}
          </ul>
        </section>

        <form method="get" action={basePath} className={styles.block}>
          <input type="hidden" name="q" value={encodeState({ draft: state.draft })} />
          <input type="hidden" name="x" value="1" />
          <fieldset className={styles.extras}>
            <legend className={styles.legend}>{result.extrasTitle}</legend>
            <p className={styles.hint}>{result.extrasHint}</p>
            <ul className={styles.chips}>
              {recommendation.available.map((slug) => (
                <li key={slug}>
                  <input
                    id={`result-extra-${slug}`}
                    className={styles.input}
                    type="checkbox"
                    name="e"
                    value={slug}
                    checked={selected.includes(slug)}
                    aria-describedby={
                      recommendation.suggested.includes(slug)
                        ? `result-suggested-${slug}`
                        : undefined
                    }
                    onChange={(event) => {
                      toggle(slug, event.target.checked);
                    }}
                  />
                  <label htmlFor={`result-extra-${slug}`} className={styles.chip}>
                    {copy.extras[slug].name}
                  </label>
                  {recommendation.suggested.includes(slug) ? (
                    <span id={`result-suggested-${slug}`} className={styles.suggested}>
                      {result.suggested}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </fieldset>
          <div className={styles.update}>
            <Button type="submit" variant="light" size="sm">
              {result.update}
            </Button>
          </div>
        </form>

        {recommendation.included.length > 0 ? (
          <section aria-labelledby="result-included" className={styles.block}>
            <Heading level={4} size="h4" id="result-included">
              {result.includedTitle}
            </Heading>
            <ul className={styles.plain}>
              {recommendation.included.map((slug) => (
                <li key={slug}>{copy.extras[slug].name}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="result-excludes" className={styles.block}>
          <Heading level={4} size="h4" id="result-excludes">
            {result.excludesTitle}
          </Heading>
          {recommendation.offers.map((slug) => (
            <div key={slug}>
              {recommendation.offers.length > 1 ? (
                <p className={styles.sub}>{copy.offers[slug].name}</p>
              ) : null}
              <ul className={styles.plain} data-tone="muted">
                {copy.offers[slug].excludes.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <div className={styles.actions}>
          <Button href={contact} icon={<ArrowIcon />} data-testid="result-cta">
            {result.cta}
          </Button>
          {assumed ? (
            <Button variant="ghost" href={buildContactHref(locale, "project")} icon={<ArrowIcon />}>
              {result.talk}
            </Button>
          ) : null}
          <Button variant="quiet" href={reviewHref} onClick={onReview}>
            {result.change}
          </Button>
        </div>
        <ShareLink
          href={shareHref}
          labels={{
            copy: result.shareCopy,
            copied: result.shareCopied,
            failed: result.shareFailed,
            link: result.shareLabel,
          }}
        />
      </Card>
    </div>
  );
}
