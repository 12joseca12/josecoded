'use client';

import { useSyncExternalStore } from 'react';

import { originAudienceSchema } from '@josecoded/types';

import { Field } from '@/components/forms/field';

const noSubscription = () => () => undefined;

function readStoredAudience(): string {
  try {
    const stored = originAudienceSchema.safeParse(sessionStorage.getItem('audience'));
    return stored.success ? stored.data : '';
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
