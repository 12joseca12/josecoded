'use client';

import { useEffect, useRef } from 'react';

import { useFormContext } from '@/components/forms/form';

/**
 * Hidden key that makes a submission idempotent: a fresh UUID per page load and after every answer of
 * the action, so a retry of the same attempt reuses it and a second message does not collapse into the
 * first. It is written into the DOM after hydration (a page rendered once for everyone cannot carry
 * one); without JavaScript the action makes its own.
 */
export function IdempotencyField() {
  const input = useRef<HTMLInputElement>(null);
  const state = useFormContext()?.state;

  useEffect(() => {
    if (input.current) input.current.value = crypto.randomUUID();
  }, [state]);

  return <input ref={input} type="hidden" name="idempotencyKey" defaultValue="" />;
}
