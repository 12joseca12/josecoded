'use client';

import { useSyncExternalStore } from 'react';

// by subpath: the barrel would put zod in this client bundle (see packages/types/src/constants)
import { ORIGIN_AUDIENCES } from '@josecoded/types/constants';

import { Field } from '@/components/forms/field';

const noSubscription = () => () => undefined;

function readStoredAudience(): string {
  try {
    const stored = sessionStorage.getItem('audience');
    return ORIGIN_AUDIENCES.find((audience) => audience === stored) ?? '';
  } catch {
    return ''; // storage blocked: no hint
  }
}

/**
 * Hidden `audience` of the sign-up: the audience the public page put in the URL, or, when the
 * visitor reached the login without it, the one the page kept in `sessionStorage` (DT §1.12). The
 * server validates it again with zod; this field only carries a hint, never a permission.
 */
export function AudienceField({ initial }: { initial?: string }) {
  const stored = useSyncExternalStore(noSubscription, readStoredAudience, () => '');
  return <Field kind="hidden" name="audience" value={initial || stored} />;
}
