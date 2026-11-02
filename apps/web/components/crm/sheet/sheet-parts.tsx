'use client';

import { useEffect } from 'react';

import { useFormContext } from '@/components/forms/form';
import { Button } from '@/components/ui/button';

import { useSheet } from './sheet-context';

/** Put it inside the `Form` of a sheet: when the action answers `ok`, the sheet closes and says it was saved. */
export function CloseWhenSaved() {
  const form = useFormContext();
  const sheet = useSheet();
  const status = form?.state.status;
  useEffect(() => {
    if (status === 'ok') sheet?.saved();
    // `sheet` changes identity on every render of the sheet; the answer of the action is what matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  return null;
}

/** Put it inside a `Form`: calls `onSaved` once when the action behind it answers `ok` (a screen moves the focus after it). */
export function WhenSaved({ onSaved }: { onSaved: () => void }) {
  const status = useFormContext()?.state.status;
  useEffect(() => {
    if (status === 'ok') onSaved();
    // the answer of the action is what matters, not the identity of the callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  return null;
}

/** The «Cancelar» next to the submit button of a form in a sheet. */
export function SheetCancel({ children }: { children: string }) {
  const sheet = useSheet();
  return (
    <Button variant="ghost" onClick={() => sheet?.close()}>
      {children}
    </Button>
  );
}
