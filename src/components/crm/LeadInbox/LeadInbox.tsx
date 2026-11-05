"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import type { ClaimHandler, ClaimResult, InboxCardData, InboxLabels } from "@/types/inbox";

import styles from "./LeadInbox.module.css";

interface LeadInboxProps {
  cards: InboxCardData[];
  labels: InboxLabels;
  claim: ClaimHandler;
  contactBase: string;
}

interface Notice {
  tone: "success" | "error";
  text: string;
}

function noticeOf(result: ClaimResult, labels: InboxLabels): Notice {
  if (result.status === "done") return { tone: "success", text: labels.notices.done };
  return { tone: "error", text: labels.notices[result.status] };
}

export function LeadInbox({ cards, labels, claim, contactBase }: LeadInboxProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [pending, startClaim] = useTransition();

  const onClaim = (id: string) => {
    if (pending) return;
    setNotice(null);
    setClaimingId(id);
    startClaim(async () => {
      const result = await claim({ leadId: id });
      setNotice(noticeOf(result, labels));
      if (result.status === "done") router.push(`${contactBase}/${result.contactId}`);
    });
  };

  return (
    <div className={styles.inbox}>
      <p
        className={styles.notice}
        data-tone={notice?.tone}
        role={notice?.tone === "error" ? "alert" : "status"}
      >
        {notice?.text}
      </p>
      <ul className={styles.cards} aria-label={labels.listLabel}>
        {cards.map((card) => (
          <li key={card.id} className={styles.card}>
            <div className={styles.head}>
              <span className={styles.name}>{card.name}</span>
              <time className={styles.date} dateTime={card.createdAt}>
                {card.dateText}
              </time>
            </div>
            <div className={styles.tags}>
              {card.viaLabel ? <span className={styles.tag}>{card.viaLabel}</span> : null}
              {card.localeLabel ? <span className={styles.tag}>{card.localeLabel}</span> : null}
            </div>
            {card.offerText ? <p className={styles.offer}>{card.offerText}</p> : null}
            {card.extrasText ? (
              <p className={styles.extras}>
                <span className={styles.extrasLabel}>{labels.extras}</span> {card.extrasText}
              </p>
            ) : null}
            <p className={styles.excerpt} data-empty={card.excerpt === null || undefined}>
              {card.excerpt ?? labels.noMessage}
            </p>
            <div className={styles.actions}>
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={pending && claimingId === card.id}
                loadingLabel={labels.claiming}
                disabled={pending && claimingId !== card.id}
                onClick={() => {
                  onClaim(card.id);
                }}
              >
                <span aria-hidden="true">{labels.claim}</span>
                <VisuallyHidden>{labels.claimAria.replace("{name}", card.name)}</VisuallyHidden>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
