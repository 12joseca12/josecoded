'use client';

import { useEffect } from 'react';

import { useFormContext } from '@/components/forms/form';
import { track } from '@/lib/analytics';

/** `proposal_sent { pack, has_ref }` once the action answers `ok` (never any contact data). */
export function SendTracker() {
  const state = useFormContext()?.state as { status?: string; pack?: string; hasRef?: boolean } | undefined;
  useEffect(() => {
    if (state?.status === 'ok') track('proposal_sent', { pack: state.pack ?? '', has_ref: Boolean(state.hasRef) });
  }, [state]);
  return null;
}
