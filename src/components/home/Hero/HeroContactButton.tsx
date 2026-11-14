"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/Button/Button";
import {
  contactChooserId,
  getChooserSnapshot,
  getServerChooserSnapshot,
  openContactChooser,
  subscribeChooserState,
} from "@/lib/contact/chooser-events";

interface HeroContactButtonProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}

const subscribeNothing = () => () => undefined;

export function HeroContactButton({ href, icon, children }: HeroContactButtonProps) {
  const [self, setSelf] = useState<HTMLElement | null>(null);
  const chooser = useSyncExternalStore(
    subscribeChooserState,
    getChooserSnapshot,
    getServerChooserSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const expanded = chooser.open && chooser.opener !== null && chooser.opener === self;

  return (
    <Button
      href={href}
      icon={icon}
      aria-haspopup={hydrated ? "dialog" : undefined}
      aria-expanded={hydrated ? expanded : undefined}
      aria-controls={expanded ? contactChooserId : undefined}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        setSelf(event.currentTarget);
        if (openContactChooser(event.currentTarget)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
