'use client';

import { useEffect } from 'react';

import { useFormContext } from '@/components/forms/form';
import { track } from '@/lib/analytics';

/**
 * Sends `contact_submit` when the action answers `ok`. It lives beside the fields instead of wrapping the
 * Server Action, because a form whose action is the Server Action itself keeps working without JavaScript.
 */
export function SubmitTracker({ via }: { via: string }) {
  const state = useFormContext()?.state;
  useEffect(() => {
    if (state?.status === 'ok') track('contact_submit', { via });
  }, [state, via]);
  return null;
}
