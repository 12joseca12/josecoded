import type { ReactNode } from "react";

import { formatMoney } from "@/lib/crm/contact-detail";
import { formatDay, isOpenStage } from "@/lib/crm/contacts";
import type { ChangeStageHandler } from "@/types/crm";
import type { DealCardLabels, DealDetail } from "@/types/crm-detail";

import { StageSheet } from "../StageSheet/StageSheet";
import styles from "./DealCard.module.css";

interface DealCardProps {
  deal: DealDetail;
  contactName: string;
  locale: string;
  labels: DealCardLabels;
  changeStage: ChangeStageHandler;
  actions?: ReactNode;
}

function named(template: string, name: string): string {
  return template.replace("{name}", name);
}

export function DealCard({
  deal,
  contactName,
  locale,
  labels,
  changeStage,
  actions,
}: DealCardProps) {
  const open = isOpenStage(deal.stage);
  const sheet = labels.stageSheet;
  return (
    <article className={styles.card} data-stage={deal.stage}>
      <div className={styles.head}>
        <span className={styles.stage} data-stage={deal.stage}>
          {labels.stages[deal.stage]}
        </span>
        <span className={styles.via}>{labels.vias[deal.via]}</span>
      </div>
      <dl className={styles.facts}>
        <div>
          <dt>{labels.amount}</dt>
          <dd>{deal.amount === null ? labels.noAmount : formatMoney(deal.amount, locale)}</dd>
        </div>
        <div>
          <dt>{labels.created}</dt>
          <dd>{formatDay(deal.created_at, locale)}</dd>
        </div>
        {deal.stage === "won" && deal.won_amount !== null ? (
          <div>
            <dt>{labels.wonAmount}</dt>
            <dd>{formatMoney(deal.won_amount, locale)}</dd>
          </div>
        ) : null}
        {deal.stage === "won" && deal.won_at !== null ? (
          <div>
            <dt>{labels.wonAt}</dt>
            <dd>{formatDay(deal.won_at, locale)}</dd>
          </div>
        ) : null}
        {deal.stage === "won" && deal.recurring_monthly !== null ? (
          <div>
            <dt>{labels.recurringMonthly}</dt>
            <dd>{formatMoney(deal.recurring_monthly, locale)}</dd>
          </div>
        ) : null}
        {deal.stage === "won" && deal.recurring_monthly !== null ? (
          <div>
            <dt>{labels.recurringStarted}</dt>
            <dd>
              {deal.recurring_started_at === null
                ? labels.recurringNotStarted
                : formatDay(deal.recurring_started_at, locale)}
            </dd>
          </div>
        ) : null}
        {deal.stage === "won" && deal.recurring_cancelled_at !== null ? (
          <div>
            <dt>{labels.recurringCancelled}</dt>
            <dd>{formatDay(deal.recurring_cancelled_at, locale)}</dd>
          </div>
        ) : null}
        {deal.stage === "lost" && deal.lost_at !== null ? (
          <div>
            <dt>{labels.lostAt}</dt>
            <dd>{formatDay(deal.lost_at, locale)}</dd>
          </div>
        ) : null}
        {deal.stage === "lost" && deal.lost_reason !== null ? (
          <div>
            <dt>{labels.lostReason}</dt>
            <dd>{deal.lost_reason}</dd>
          </div>
        ) : null}
      </dl>
      {deal.stage === "won" ? (
        actions ? (
          <div className={styles.actions}>{actions}</div>
        ) : null
      ) : (
        <div className={styles.actions}>
          {open ? (
            <>
              {actions}
              <StageSheet
                dealId={deal.id}
                stage={deal.stage}
                updatedAt={deal.updated_at}
                labels={sheet}
                change={changeStage}
                triggerText={sheet.open}
                triggerAria={named(sheet.openAria, contactName)}
                triggerVariant="light"
              />
              <StageSheet
                dealId={deal.id}
                stage={deal.stage}
                updatedAt={deal.updated_at}
                labels={sheet}
                change={changeStage}
                triggerText={labels.lose}
                triggerAria={named(labels.loseAria, contactName)}
                initialStage="lost"
              />
            </>
          ) : (
            <StageSheet
              dealId={deal.id}
              stage={deal.stage}
              updatedAt={deal.updated_at}
              labels={sheet}
              change={changeStage}
              triggerText={labels.reopen}
              triggerAria={named(labels.reopenAria, contactName)}
              initialStage="new"
              triggerVariant="light"
            />
          )}
        </div>
      )}
    </article>
  );
}
