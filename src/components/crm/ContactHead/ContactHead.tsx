import type { ReactNode } from "react";

import { CopyButton } from "@/components/contact/CopyButton/CopyButton";
import { Heading } from "@/components/ui/Heading/Heading";
import { formatDay, isOverdue } from "@/lib/crm/contacts";
import { telHref, whatsappHref } from "@/lib/crm/phone";
import type { ContactDetail, ContactHeadLabels } from "@/types/crm-detail";

import styles from "./ContactHead.module.css";

interface ContactHeadProps {
  contact: ContactDetail;
  ownerName: string | null;
  locale: string;
  nowIso: string;
  labels: ContactHeadLabels;
  actions: ReactNode;
}

const emptyCell = "\u2014";

function named(template: string, name: string): string {
  return template.replace("{name}", name);
}

export function ContactHead({
  contact,
  ownerName,
  locale,
  nowIso,
  labels,
  actions,
}: ContactHeadProps) {
  const tel = telHref(contact.phone);
  const wa = whatsappHref(contact.phone);
  const late = isOverdue(contact.next_action_at, nowIso);
  const subtitle = [contact.role_title, contact.organization].filter(Boolean).join(", ");
  const owner = contact.owner_id === null ? labels.noOwner : (ownerName ?? labels.unknownOwner);
  return (
    <section className={styles.head} aria-labelledby="contact-name">
      <div className={styles.top}>
        <div className={styles.title}>
          <Heading level={1} size="h2" id="contact-name">
            {contact.full_name}
          </Heading>
          <p className={styles.sub}>
            <span className={styles.badge}>{labels.kinds[contact.kind]}</span>
            {subtitle !== "" ? <span>{subtitle}</span> : null}
          </p>
        </div>
        <div className={styles.actions}>{actions}</div>
      </div>
      <dl className={styles.facts}>
        <div>
          <dt>{labels.email}</dt>
          <dd className={styles.inline}>
            {contact.email === null ? (
              <span className={styles.muted}>{labels.noEmail}</span>
            ) : (
              <>
                <a href={`mailto:${contact.email}`} className={styles.link}>
                  {contact.email}
                </a>
                <CopyButton
                  value={contact.email}
                  label={labels.copy}
                  ariaLabel={named(labels.copyAria, contact.full_name)}
                  doneLabel={labels.copied}
                />
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>{labels.phone}</dt>
          <dd className={styles.inline}>
            {contact.phone === null ? (
              <span className={styles.muted}>{emptyCell}</span>
            ) : (
              <>
                <span>{contact.phone}</span>
                {tel !== null ? (
                  <a
                    href={tel}
                    className={styles.pill}
                    aria-label={named(labels.callAria, contact.full_name)}
                  >
                    {labels.call}
                  </a>
                ) : null}
                {wa !== null ? (
                  <a
                    href={wa}
                    className={styles.pill}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={named(labels.whatsappAria, contact.full_name)}
                  >
                    {labels.whatsapp}
                  </a>
                ) : null}
              </>
            )}
          </dd>
        </div>
        {contact.city !== null ? (
          <div>
            <dt>{labels.city}</dt>
            <dd>{contact.city}</dd>
          </div>
        ) : null}
        {contact.website !== null ? (
          <div>
            <dt>{labels.website}</dt>
            <dd className={styles.wrap}>{contact.website}</dd>
          </div>
        ) : null}
        <div>
          <dt>{labels.owner}</dt>
          <dd data-field="owner">{owner}</dd>
        </div>
        <div>
          <dt>{labels.nextStep}</dt>
          <dd>
            {contact.next_action === null && contact.next_action_at === null ? (
              <span className={styles.muted}>{labels.noNextStep}</span>
            ) : (
              <>
                {contact.next_action}
                {contact.next_action_at !== null ? (
                  <span className={styles.date} data-late={late || undefined}>
                    {formatDay(contact.next_action_at, locale)}
                    {late ? ` ${labels.overdue}` : ""}
                  </span>
                ) : null}
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>{labels.lastContact}</dt>
          <dd>
            {contact.last_activity_at === null ? (
              <span className={styles.muted}>{labels.never}</span>
            ) : (
              formatDay(contact.last_activity_at, locale)
            )}
          </dd>
        </div>
        <div>
          <dt>{labels.source}</dt>
          <dd>{labels.sources[contact.source]}</dd>
        </div>
      </dl>
      {contact.tags.length > 0 ? (
        <ul className={styles.tags} aria-label={labels.tags}>
          {contact.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      ) : null}
      {contact.notes !== null && contact.notes !== "" ? (
        <div className={styles.notes}>
          <p className={styles.notesLabel}>{labels.notes}</p>
          <p className={styles.notesBody}>{contact.notes}</p>
        </div>
      ) : null}
    </section>
  );
}
