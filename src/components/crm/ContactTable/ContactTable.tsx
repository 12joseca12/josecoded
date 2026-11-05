import Link from "next/link";

import { formatDay, isOpenStage, isOverdue, primaryDeal } from "@/lib/crm/contacts";
import { telHref, whatsappHref } from "@/lib/crm/phone";
import type { ChangeStageHandler, ContactRow, ContactTableLabels } from "@/types/crm";

import { StageSheet } from "../StageSheet/StageSheet";
import styles from "./ContactTable.module.css";

interface ContactTableProps {
  rows: ContactRow[];
  owners: Record<string, string>;
  showOwner: boolean;
  locale: string;
  nowIso: string;
  labels: ContactTableLabels;
  changeStage: ChangeStageHandler;
}

const emptyCell = "\u2014";
const separator = " \u00b7 ";

function named(template: string, name: string): string {
  return template.replace("{name}", name);
}

export function ContactTable({
  rows,
  owners,
  showOwner,
  locale,
  nowIso,
  labels,
  changeStage,
}: ContactTableProps) {
  const ownerName = (id: string | null) =>
    id === null ? labels.noOwner : (owners[id] ?? labels.unknownOwner);

  const nextAction = (row: ContactRow) => {
    if (row.next_action === null && row.next_action_at === null) {
      return <span className={styles.muted}>{labels.noNextAction}</span>;
    }
    const late = isOverdue(row.next_action_at, nowIso);
    return (
      <>
        {row.next_action !== null ? <span>{row.next_action}</span> : null}
        {row.next_action_at !== null ? (
          <span className={styles.date} data-late={late || undefined}>
            {formatDay(row.next_action_at, locale)}
            {late ? `${separator}${labels.overdue}` : ""}
          </span>
        ) : null}
      </>
    );
  };

  const stageCell = (row: ContactRow) => {
    const deal = primaryDeal(row.deals);
    if (deal === null) return <span className={styles.muted}>{labels.noDeal}</span>;
    return (
      <>
        <span className={styles.stage} data-stage={deal.stage}>
          {labels.stages[deal.stage]}
        </span>
        <span className={styles.muted}>{labels.vias[deal.via]}</span>
        {isOpenStage(deal.stage) ? (
          <StageSheet
            dealId={deal.id}
            stage={deal.stage}
            updatedAt={deal.updated_at}
            labels={labels.stageSheet}
            change={changeStage}
            triggerText={labels.stageSheet.open}
            triggerAria={named(labels.stageSheet.openAria, row.full_name)}
          />
        ) : null}
      </>
    );
  };

  const lastContact = (row: ContactRow) =>
    row.last_activity_at === null ? (
      <span className={styles.muted}>{labels.never}</span>
    ) : (
      formatDay(row.last_activity_at, locale)
    );

  return (
    <div className={styles.list}>
      <div className={styles.region} role="region" aria-label={labels.region} tabIndex={0}>
        <table className={styles.table}>
          <caption className={styles.caption}>{labels.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{labels.columns.name}</th>
              <th scope="col">{labels.columns.organization}</th>
              <th scope="col">{labels.columns.kind}</th>
              <th scope="col">{labels.columns.stage}</th>
              <th scope="col">{labels.columns.nextAction}</th>
              <th scope="col">{labels.columns.lastContact}</th>
              <th scope="col">{labels.columns.source}</th>
              {showOwner ? <th scope="col">{labels.columns.owner}</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">
                  <div className={styles.name}>
                    <Link href={`/${locale}/crm/contactos/${row.id}`} className={styles.link}>
                      {row.full_name}
                    </Link>
                    <span className={styles.muted}>{row.email ?? labels.noEmail}</span>
                  </div>
                </th>
                <td>{row.organization ?? <span className={styles.muted}>{emptyCell}</span>}</td>
                <td>{labels.kinds[row.kind]}</td>
                <td>
                  <div className={styles.stack}>{stageCell(row)}</div>
                </td>
                <td>
                  <div className={styles.stack}>{nextAction(row)}</div>
                </td>
                <td className={styles.date}>{lastContact(row)}</td>
                <td>{labels.sources[row.source]}</td>
                {showOwner ? <td>{ownerName(row.owner_id)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className={styles.cards} aria-label={labels.listLabel}>
        {rows.map((row) => {
          const tel = telHref(row.phone);
          const wa = whatsappHref(row.phone);
          return (
            <li key={row.id} className={styles.card}>
              <div className={styles.cardHead}>
                <Link href={`/${locale}/crm/contactos/${row.id}`} className={styles.link}>
                  {row.full_name}
                </Link>
                <span className={styles.muted}>
                  {[row.organization, labels.kinds[row.kind]].filter(Boolean).join(separator)}
                </span>
              </div>
              <div className={styles.cardStage}>{stageCell(row)}</div>
              <div className={styles.stack}>{nextAction(row)}</div>
              <dl className={styles.facts}>
                <div>
                  <dt>{labels.columns.lastContact}</dt>
                  <dd>{lastContact(row)}</dd>
                </div>
                {showOwner ? (
                  <div>
                    <dt>{labels.columns.owner}</dt>
                    <dd>{ownerName(row.owner_id)}</dd>
                  </div>
                ) : null}
              </dl>
              {tel !== null || wa !== null ? (
                <div className={styles.contactActions}>
                  {tel !== null ? (
                    <a
                      href={tel}
                      className={styles.contactLink}
                      aria-label={named(labels.callAria, row.full_name)}
                    >
                      {labels.call}
                    </a>
                  ) : null}
                  {wa !== null ? (
                    <a
                      href={wa}
                      className={styles.contactLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={named(labels.whatsappAria, row.full_name)}
                    >
                      {labels.whatsapp}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
