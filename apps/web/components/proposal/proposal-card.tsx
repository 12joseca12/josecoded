import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';
import { formatEuros } from '@/lib/proposal/api';

import styles from './proposal-card.module.css';

import type { ProposalResponse } from '@josecoded/types';

const SEPARATOR = ' · ';

export interface ProposalCardLabels {
  title: string;
  /** «Pack {code}: {name}» already filled. */
  pack: string;
  from: string;
  vat: string;
  weeks: string;
  includes: string;
  scope: string;
  extras: string;
  extrasMonthly: string;
  questions: string;
  source: string;
  appTitle: string;
  appText: string;
  send: string;
  restart: string;
  packs: string;
}

/**
 * The proposal the gateway prepared: pack, «desde» price, time, what is included, the expected scope,
 * optional extras and the questions that would refine it. The price is the gateway's (from the price list;
 * the model never sets one). When the proposal is an app, the card says so instead of showing a web pack.
 *
 * A11y: a `section` named by its `h2`; the price is text; the disclaimer is plain text, always visible.
 */
export function ProposalCard({
  proposal,
  locale,
  labels,
  onSend,
  onRestart,
}: {
  proposal: ProposalResponse;
  locale: 'es' | 'en';
  labels: ProposalCardLabels;
  onSend: () => void;
  onRestart: () => void;
}) {
  const money = (amount: number) => formatEuros(amount, locale);
  return (
    <Surface as="section" aria-labelledby="proposal-card-title" data-pack={proposal.pack.code}>
      <div className={styles.card}>
        <h2 id="proposal-card-title" className={styles.title} tabIndex={-1}>
          {labels.title}
        </h2>
        <p className={styles.pack}>{labels.pack}</p>
        <p className={styles.price}>
          <strong>{labels.from}</strong> <span>{labels.vat}</span>
          {SEPARATOR}
          <span>{labels.weeks}</span>
        </p>
        {proposal.summary ? <p className={styles.summary}>{proposal.summary}</p> : null}
        {proposal.isApp ? (
          <div className={styles.app}>
            <p className={styles.sub}>{labels.appTitle}</p>
            <p>{labels.appText}</p>
          </div>
        ) : null}
        <div className={styles.cols}>
          <div>
            <p className={styles.sub}>{labels.includes}</p>
            <ul className={styles.list}>
              {proposal.pack.includes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className={styles.sub}>{labels.scope}</p>
            <ul className={styles.list}>
              {proposal.scope.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
        {proposal.recommendedExtras.length > 0 ? (
          <div>
            <p className={styles.sub}>{labels.extras}</p>
            <ul className={styles.list}>
              {proposal.recommendedExtras.map((extra) => (
                <li key={extra.code}>
                  {extra.label}
                  {SEPARATOR}
                  {money(extra.price)}
                  {extra.billing === 'monthly' ? labels.extrasMonthly : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {proposal.questions.length > 0 ? (
          <div>
            <p className={styles.sub}>{labels.questions}</p>
            <ul className={styles.list}>
              {proposal.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className={styles.note}>{labels.source}</p>
        <p className={styles.note}>{proposal.disclaimer}</p>
        <div className={styles.actions}>
          <Button onClick={onSend} icon="sparkles">
            {labels.send}
          </Button>
          <Button onClick={onRestart} variant="ghost">
            {labels.restart}
          </Button>
          <ArrowLink href="/servicios#packs" emphasis="strong">
            {labels.packs}
          </ArrowLink>
        </div>
      </div>
    </Surface>
  );
}
