'use client';

import { useEffect, useRef } from 'react';

import { useFormContext } from '@/components/forms/form';

/**
 * Hidden key that makes a submission idempotent: a fresh UUID per page load and after an `ok` answer
 * only, so a retry after an error reuses it (the gateway collapses the double) and a second message does
 * not collapse into the first. It is written into the DOM after hydration (a page rendered once for everyone cannot carry
 * one); without JavaScript the action makes its own.
 */
export function IdempotencyField() {
  const input = useRef<HTMLInputElement>(null);
  const status = useFormContext()?.state.status;

  useEffect(() => {
    const field = input.current;
    if (!field || (field.defaultValue !== '' && status !== 'ok')) return;
    // the default too: React resets a form after its action, and the reset must give back this key
    const key = crypto.randomUUID();
    field.defaultValue = key;
    field.value = key;
  }, [status]);

  return <input ref={input} type="hidden" name="idempotencyKey" defaultValue="" />;
}
