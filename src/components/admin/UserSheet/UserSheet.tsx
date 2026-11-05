"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import type { UserRow } from "@/types/users";
import type { ManageHandlers, ReassignTarget, UserSheetLabels } from "@/types/users-manage";

import { HistorySection } from "./HistorySection";
import { RatesSection } from "./RatesSection";
import { ReassignSection } from "./ReassignSection";
import { StatusSection } from "./StatusSection";
import { TotpSection } from "./TotpSection";
import styles from "./UserSheet.module.css";

interface UserSheetProps {
  user: UserRow;
  targets: ReassignTarget[];
  isSelf: boolean;
  locale: string;
  labels: UserSheetLabels;
  handlers: ManageHandlers;
}

export function UserSheet({ user, targets, isSelf, locale, labels, handlers }: UserSheetProps) {
  const [open, setOpen] = useState(false);
  const canReassign = user.role === "closer" || user.role === "admin";
  const canResetTotp = user.role !== "client" && !isSelf;

  return (
    <>
      <Button
        variant="light"
        size="sm"
        aria-label={labels.openFor.replace("{name}", user.full_name)}
        onClick={() => {
          setOpen(true);
        }}
      >
        {labels.open}
      </Button>
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title={user.full_name}
        closeLabel={labels.close}
      >
        <p className={styles.email}>{user.email}</p>
        <RatesSection user={user} labels={labels} save={handlers.rates} />
        <StatusSection user={user} labels={labels} setActive={handlers.active} />
        {canReassign ? (
          <ReassignSection
            user={user}
            targets={targets}
            labels={labels}
            reassign={handlers.reassign}
          />
        ) : null}
        {canResetTotp ? (
          <TotpSection user={user} labels={labels} reset={handlers.resetTotp} />
        ) : null}
        <HistorySection userId={user.id} locale={locale} labels={labels} load={handlers.history} />
      </Sheet>
    </>
  );
}
