import NextLink from "next/link";

import { Heading } from "@/components/ui/Heading/Heading";
import { PrintButton } from "@/components/ui/PrintButton/PrintButton";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents, formatRate } from "@/lib/money";
import type { ProformaPrintLabels, ProformaRow } from "@/types/proforma";

import styles from "./ProformaPrint.module.css";

interface ProformaPrintProps {
  proforma: ProformaRow;
  locale: string;
  backHref: string;
  labels: ProformaPrintLabels;
}

export function ProformaPrint({ proforma, locale, backHref, labels }: ProformaPrintProps) {
  const contact = proforma.deals?.contacts ?? null;
  const dueAt = proforma.payment_schedule?.due_at ?? null;
  return (
    <div className={styles.page}>
      <div className={styles.controls} data-print="hide">
        <NextLink className={styles.back} href={backHref}>
          {labels.back}
        </NextLink>
        <PrintButton label={labels.print} />
        <p className={styles.hint}>{labels.printHint}</p>
      </div>
      <article className={styles.sheet} data-void={proforma.status === "void" ? "true" : undefined}>
        <header className={styles.head}>
          <Heading level={1} size="h2">
            {labels.heading}
          </Heading>
          <p className={styles.notice} role="note">
            {labels.notInvoice}
          </p>
          {proforma.status === "void" ? <p className={styles.void}>{labels.void}</p> : null}
        </header>

        <dl className={styles.meta}>
          <div>
            <dt>{labels.number}</dt>
            <dd>{proforma.number}</dd>
          </div>
          <div>
            <dt>{labels.issuedAt}</dt>
            <dd>{formatDay(proforma.issued_at, locale)}</dd>
          </div>
          <div>
            <dt>{labels.dueAt}</dt>
            <dd>{dueAt === null ? labels.noDue : formatDay(dueAt, locale)}</dd>
          </div>
        </dl>

        <div className={styles.parties}>
          <section aria-labelledby="proforma-issuer">
            <h2 id="proforma-issuer" className={styles.partyTitle}>
              {labels.issuer.title}
            </h2>
            <p className={styles.party}>
              <strong>{labels.issuer.name}</strong>
              <span>{labels.issuer.taxId}</span>
              <span>{labels.issuer.location}</span>
              <span>{labels.issuer.email}</span>
            </p>
          </section>
          <section aria-labelledby="proforma-client">
            <h2 id="proforma-client" className={styles.partyTitle}>
              {labels.client.title}
            </h2>
            <p className={styles.party}>
              <strong>{contact?.full_name ?? "—"}</strong>
              {contact?.organization ? <span>{contact.organization}</span> : null}
            </p>
          </section>
        </div>

        <section aria-labelledby="proforma-concept">
          <h2 id="proforma-concept" className={styles.partyTitle}>
            {labels.concept.title}
          </h2>
          <p className={styles.concept}>
            {labels.concept.deal}
            {proforma.payment_schedule ? `: ${proforma.payment_schedule.label}` : ""}
          </p>
        </section>

        <table className={styles.totals}>
          <caption className={styles.caption}>{labels.concept.title}</caption>
          <tbody>
            <tr>
              <th scope="row">{labels.totals.net}</th>
              <td>{formatCents(proforma.amount_net, locale)}</td>
            </tr>
            <tr>
              <th scope="row">
                {labels.totals.vat.replace("{rate}", formatRate(proforma.vat_rate, locale))}
              </th>
              <td>{formatCents(proforma.vat_amount, locale)}</td>
            </tr>
            <tr data-total="true">
              <th scope="row">{labels.totals.gross}</th>
              <td>{formatCents(proforma.amount_gross, locale)}</td>
            </tr>
          </tbody>
        </table>

        <p className={styles.footer}>{labels.footer.replace("{number}", proforma.number)}</p>
      </article>
    </div>
  );
}
