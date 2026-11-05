"use client";

import { lazy, type RefObject, Suspense, useRef } from "react";

import { Button } from "@/components/ui/Button/Button";
import { ChevronIcon } from "@/components/ui/icons/ChevronIcon";
import { preloadLater } from "@/lib/preload-later";
import { useMountedOnceOpen } from "@/lib/use-mounted-once-open";
import type { ContactChooserLabels } from "@/types/nav";

import styles from "./ContactChooser.module.css";
import type { ChooserFocus } from "./ContactChooserPanel";

export type { ChooserFocus };

const loadPanel = () =>
  import("./ContactChooserPanel").then((module) => ({ default: module.ContactChooserPanel }));
const ContactChooserPanel = lazy(loadPanel);
preloadLater(loadPanel);

interface ContactChooserProps {
  id: string;
  open: boolean;
  focus: ChooserFocus;
  onOpen: (focus: ChooserFocus) => void;
  onClose: () => void;
  triggerLabel: string;
  labels: ContactChooserLabels;
  whatsappHref: string | null;
  formHref: string;
  chatEnabled: boolean;
  onChat: () => void;
  openerRef: RefObject<HTMLElement | null>;
}

export function ContactChooser({
  id,
  open,
  focus,
  onOpen,
  onClose,
  triggerLabel,
  labels,
  whatsappHref,
  formHref,
  chatEnabled,
  onChat,
  openerRef,
}: ContactChooserProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const armed = useMountedOnceOpen(open);

  return (
    <div className={styles.anchor} ref={anchorRef} data-open={open || undefined}>
      <Button
        size="sm"
        icon={<ChevronIcon />}
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup="dialog"
        data-chooser-trigger=""
        onClick={(event) => {
          if (open) {
            onClose();
            return;
          }
          openerRef.current = event.currentTarget;
          onOpen("first");
        }}
      >
        {triggerLabel}
      </Button>
      {armed ? (
        <Suspense fallback={null}>
          <ContactChooserPanel
            id={id}
            open={open}
            focus={focus}
            onClose={onClose}
            labels={labels}
            whatsappHref={whatsappHref}
            formHref={formHref}
            chatEnabled={chatEnabled}
            onChat={onChat}
            openerRef={openerRef}
            anchorRef={anchorRef}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
