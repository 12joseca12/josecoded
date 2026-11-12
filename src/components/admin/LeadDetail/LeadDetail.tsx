import Link from "next/link";
import type { ReactNode } from "react";

import { Heading } from "@/components/ui/Heading/Heading";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import {
  describeAnswers,
  describeExtras,
  describeOffer,
  type OfferLabels,
} from "@/lib/admin/lead-offer";
import { formatLeadDate } from "@/lib/admin/leads";
import type { LeadDetailLabels, LeadDetailRow } from "@/types/leads";

import styles from "./LeadDetail.module.css";

interface LeadDetailProps {
  lead: LeadDetailRow;
  locale: string;
  labels: LeadDetailLabels;
  offerLabels: OfferLabels;
  submissionCount: number;
}

interface RowProps {
  term: string;
  children: ReactNode;
}

function Row({ term, children }: RowProps) {
  return (
    <div className={styles.row}>
      <dt className={styles.term}>{term}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <Heading level={2} size="h4">
        {title}
      </Heading>
      {children}
    </section>
  );
}

export function LeadDetail({
  lead,
  locale,
  labels,
  offerLabels,
  submissionCount,
}: LeadDetailProps) {
  const { origin, offer, contact } = labels;
  const answers = lead.offer_answers ? describeAnswers(lead.offer_answers, offerLabels) : [];
  const yesNo = (value: boolean) => (value ? offer.yes : offer.no);
  const hasOffer =
    lead.offer !== null ||
    lead.extras.length > 0 ||
    answers.length > 0 ||
    lead.company !== null ||
    lead.offer_url !== null ||
    lead.wanted_by !== null ||
    lead.has_domain !== null ||
    lead.has_store_accounts !== null;

  return (
    <div className={styles.detail}>
      <Section title={labels.message.title}>
        {lead.message ? (
          <p className={styles.message}>{lead.message}</p>
        ) : (
          <p className={styles.muted}>{labels.message.empty}</p>
        )}
      </Section>
      <Section title={contact.title}>
        <dl className={styles.list}>
          <Row term={contact.email}>
            {lead.email ?? <span className={styles.muted}>{contact.none}</span>}
            {lead.email && submissionCount >= 2 ? (
              <Link
                className={styles.repeat}
                href={`/${locale}/admin/interesados?q=${encodeURIComponent(lead.email)}`}
                aria-label={labels.table.repeat.link.replace("{count}", String(submissionCount))}
              >
                <StatusPill tone="alert">
                  {labels.table.repeat.label.replace("{count}", String(submissionCount))}
                </StatusPill>
              </Link>
            ) : null}
          </Row>
          <Row term={contact.phone}>
            {lead.phone ?? <span className={styles.muted}>{contact.none}</span>}
          </Row>
          <Row term={contact.organization}>
            {lead.organization ?? <span className={styles.muted}>{contact.none}</span>}
          </Row>
        </dl>
      </Section>
      {hasOffer ? (
        <Section title={offer.title}>
          <dl className={styles.list}>
            {lead.offer ? (
              <Row term={offer.offer}>{describeOffer(lead.offer, offerLabels)}</Row>
            ) : null}
            {lead.extras.length > 0 ? (
              <Row term={offer.extras}>{describeExtras(lead.extras, offerLabels)}</Row>
            ) : null}
            {answers.length > 0 ? (
              <Row term={offer.answers}>
                <ul className={styles.answers}>
                  {answers.map((line) => (
                    <li key={line.question}>
                      <span className={styles.muted}>{line.question}</span> {line.value}
                    </li>
                  ))}
                </ul>
              </Row>
            ) : null}
            {lead.company ? <Row term={offer.company}>{lead.company}</Row> : null}
            {lead.offer_url ? (
              <Row term={offer.offerUrl}>
                <a
                  className={styles.link}
                  href={lead.offer_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  {lead.offer_url}
                </a>
              </Row>
            ) : null}
            {lead.wanted_by ? <Row term={offer.wantedBy}>{lead.wanted_by}</Row> : null}
            {lead.has_domain !== null ? (
              <Row term={offer.hasDomain}>{yesNo(lead.has_domain)}</Row>
            ) : null}
            {lead.has_store_accounts !== null ? (
              <Row term={offer.hasStoreAccounts}>{yesNo(lead.has_store_accounts)}</Row>
            ) : null}
          </dl>
        </Section>
      ) : null}
      <Section title={origin.title}>
        <dl className={styles.list}>
          <Row term={origin.source}>{labels.table.sources[lead.source]}</Row>
          <Row term={origin.via}>{labels.table.via[lead.via ?? "none"]}</Row>
          <Row term={origin.created}>
            <time dateTime={lead.created_at}>{formatLeadDate(lead.created_at, locale)}</time>
          </Row>
          {lead.page_path ? <Row term={origin.page}>{lead.page_path}</Row> : null}
          {lead.locale ? <Row term={origin.locale}>{origin.locales[lead.locale]}</Row> : null}
          <Row term={origin.consent}>
            {lead.consent_at
              ? origin.consentYes.replace("{date}", formatLeadDate(lead.consent_at, locale))
              : origin.consentNo}
          </Row>
        </dl>
      </Section>
    </div>
  );
}
