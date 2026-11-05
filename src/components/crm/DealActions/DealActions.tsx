"use client";

import { useState } from "react";

import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";

import { CancelRecurringButton } from "../CancelRecurringButton/CancelRecurringButton";
import { WinDealSheet } from "../WinDealSheet/WinDealSheet";

type WinProps = Omit<Parameters<typeof WinDealSheet>[0], "onDone">;
type CancelProps = Omit<Parameters<typeof CancelRecurringButton>[0], "onDone">;

interface DealActionsProps {
  win: WinProps | null;
  cancel: CancelProps | null;
}

export function DealActions({ win, cancel }: DealActionsProps) {
  const [announce, setAnnounce] = useState("");
  return (
    <>
      {win ? <WinDealSheet {...win} onDone={setAnnounce} /> : null}
      {cancel ? <CancelRecurringButton {...cancel} onDone={setAnnounce} /> : null}
      <VisuallyHidden>
        <span role="status">{announce}</span>
      </VisuallyHidden>
    </>
  );
}
