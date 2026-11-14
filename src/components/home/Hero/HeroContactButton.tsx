"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button/Button";

interface HeroContactButtonProps {
  icon: ReactNode;
  children: ReactNode;
}

function openHeaderChooser() {
  const trigger = document.querySelector<HTMLElement>("[data-chooser-trigger]");
  if (trigger && trigger.getAttribute("aria-expanded") !== "true") trigger.click();
}

export function HeroContactButton({ icon, children }: HeroContactButtonProps) {
  return (
    <Button type="button" icon={icon} aria-haspopup="dialog" onClick={openHeaderChooser}>
      {children}
    </Button>
  );
}
