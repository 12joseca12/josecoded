'use client';

import { createContext, useContext, useState } from 'react';

import { Button } from '@/components/ui/button';

import { Sheet } from '../sheet';
import { StatusForm } from './status-form';

import type { StatusOptions, StatusSheetContact, StatusSheetLabels } from './types';
import type { ReactNode } from 'react';

const OpenContext = createContext<((contact: StatusSheetContact) => void) | null>(null);

/**
 * One status sheet for the whole inbox: the buttons of the rows open it for their contact. 25 rows do not carry 25
 * dialogs. Wrap the table in it.
 */
export function StatusSheetHost({
  options,
  labels,
  children,
}: {
  options: StatusOptions;
  labels: StatusSheetLabels;
  children: ReactNode;
}) {
  const [contact, setContact] = useState<StatusSheetContact | null>(null);
  return (
    <OpenContext value={setContact}>
      {children}
      <Sheet
        open={contact !== null}
        onClose={() => setContact(null)}
        title={labels.title}
        description={contact ? [contact.name, contact.organization].filter(Boolean).join(' · ') : undefined}
        closeLabel={labels.close}
        savedMessage={labels.saved}
      >
        {contact ? <StatusForm key={contact.id} contact={contact} options={options[contact.kind]} labels={labels} /> : null}
      </Sheet>
    </OpenContext>
  );
}

/** The pencil of a row. Its name says whose contact it changes. */
export function StatusSheetButton({ contact, ariaLabel }: { contact: StatusSheetContact; ariaLabel: string }) {
  const open = useContext(OpenContext);
  return (
    <Button
      iconOnly
      icon="pencil"
      variant="quiet"
      size="sm"
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      onClick={() => open?.(contact)}
    />
  );
}
