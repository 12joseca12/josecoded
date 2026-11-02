'use client';

import { useState } from 'react';

import { resolveConflict } from '@/app/[locale]/(staff)/crm/importar/actions';
import { CloseWhenSaved, Sheet, SheetCancel } from '@/components/crm/sheet';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';
import { Button } from '@/components/ui/button';
import { RESOLUTION_ORDER } from '@/lib/crm/conflicts';

import styles from './conflict-queue.module.css';

import type { ConflictResolutionKind, IconName, Locale } from '@josecoded/types';

const ICONS: Record<ConflictResolutionKind, IconName> = {
  assign_existing: 'user-check',
  assign_importer: 'user-cog',
  merge: 'git-merge',
  discard: 'trash-2',
};

/** Texts of one case, already translated with the names of the two people in them. */
export interface ConflictActionLabels {
  note: string;
  notePlaceholder: string;
  group: string;
  cancel: string;
  close: string;
  saved: string;
  actions: Record<ConflictResolutionKind, { label: string; confirm: string }>;
}

/**
 * The note and the four resolutions of a conflict. Each button opens a small dialog that says what will happen and
 * resolves on confirm: nothing is decided by one click. The note is shared by the four (it is typed once and
 * travels with whichever is confirmed); it is saved with the resolution and the importer never sees it.
 */
export function ConflictActions({
  conflictId,
  locale,
  labels,
}: {
  conflictId: string;
  locale: Locale;
  labels: ConflictActionLabels;
}) {
  const [note, setNote] = useState('');
  const [open, setOpen] = useState<ConflictResolutionKind | null>(null);

  return (
    <>
      <Field
        kind="text"
        name="note"
        label={labels.note}
        placeholder={labels.notePlaceholder}
        maxLength={1000}
        value={note}
        onChange={setNote}
      />
      <div className={styles.actions} role="group" aria-label={labels.group}>
        {RESOLUTION_ORDER.map((resolution) => (
          <Button
            key={resolution}
            variant="ghost"
            size="sm"
            icon={ICONS[resolution]}
            aria-haspopup="dialog"
            onClick={() => setOpen(resolution)}
          >
            {labels.actions[resolution].label}
          </Button>
        ))}
      </div>
      {RESOLUTION_ORDER.map((resolution) => (
        <Sheet
          key={resolution}
          open={open === resolution}
          onClose={() => setOpen((current) => (current === resolution ? null : current))}
          title={labels.actions[resolution].label}
          description={labels.actions[resolution].confirm}
          variant="dialog"
          closeLabel={labels.close}
          savedMessage={labels.saved}
        >
          <Form
            action={resolveConflict}
            submitLabel={labels.actions[resolution].label}
            label={labels.actions[resolution].label}
            actions={<SheetCancel>{labels.cancel}</SheetCancel>}
          >
            <CloseWhenSaved />
            <Field kind="hidden" name="conflict_id" value={conflictId} />
            <Field kind="hidden" name="resolution" value={resolution} />
            <Field kind="hidden" name="note" value={note} />
            <Field kind="hidden" name="locale" value={locale} />
          </Form>
        </Sheet>
      ))}
    </>
  );
}
