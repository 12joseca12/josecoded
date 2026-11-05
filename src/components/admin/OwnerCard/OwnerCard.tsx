import Link from "next/link";
import type { ReactNode } from "react";

import { Heading } from "@/components/ui/Heading/Heading";
import { formatLeadDate } from "@/lib/admin/leads";
import type {
  LeadActionHandler,
  LeadAssignee,
  LeadDetailLabels,
  LeadDetailRow,
} from "@/types/leads";

import { LeadStatus } from "../LeadStatus/LeadStatus";
import { LeadActions } from "../LeadTable/LeadActions";
import styles from "./OwnerCard.module.css";

interface OwnerCardProps {
  lead: LeadDetailRow;
  assignees: LeadAssignee[];
  dealStage: string | null;
  locale: string;
  labels: LeadDetailLabels;
  contactHref: string | null;
  assign: LeadActionHandler;
  discard: LeadActionHandler;
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <dt className={styles.term}>{term}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  );
}

function stageLabel(stage: string | null, labels: LeadDetailLabels): string | null {
  if (stage === null) return null;
  return (labels.stage as Record<string, string>)[stage] ?? stage;
}

export function OwnerCard({
  lead,
  assignees,
  dealStage,
  locale,
  labels,
  contactHref,
  assign,
  discard,
}: OwnerCardProps) {
  const { owner, table } = labels;
  const names = new Map(assignees.map((entry) => [entry.id, entry.name]));
  const nameOf = (id: string | null) =>
    id === null ? null : (names.get(id) ?? table.unknownAssignee);
  const waiting = lead.status === "new" && lead.contact_id !== null;
  const stage = stageLabel(dealStage, labels);
  const assignedBy = lead.assigned_to ? (nameOf(lead.assigned_by) ?? owner.automatic) : null;

  return (
    <aside className={styles.card} aria-labelledby="owner-title">
      <Heading level={2} size="h4" id="owner-title">
        {owner.title}
      </Heading>
      <dl className={styles.list}>
        <Row term={owner.status}>
          <LeadStatus status={lead.status} label={table.status[lead.status]} />
          {waiting ? <span className={styles.note}>{owner.waiting}</span> : null}
        </Row>
        <Row term={owner.assignedTo}>
          {nameOf(lead.assigned_to) ?? <span className={styles.muted}>{table.unassigned}</span>}
        </Row>
        {assignedBy ? <Row term={owner.assignedBy}>{assignedBy}</Row> : null}
        {lead.assigned_at ? (
          <Row term={owner.assignedAt}>
            <time dateTime={lead.assigned_at}>{formatLeadDate(lead.assigned_at, locale)}</time>
          </Row>
        ) : null}
        {lead.contact_id ? (
          <Row term={owner.contact}>
            {contactHref ? (
              <Link className={styles.link} href={contactHref}>
                {owner.contactLink}
              </Link>
            ) : (
              owner.contact
            )}
          </Row>
        ) : null}
        {lead.contact_id ? (
          <Row term={owner.deal}>
            {stage ?? <span className={styles.muted}>{owner.dealNone}</span>}
          </Row>
        ) : null}
      </dl>
      <LeadActions
        lead={lead}
        assignees={assignees}
        labels={table.actions}
        assign={assign}
        discard={discard}
      />
    </aside>
  );
}
