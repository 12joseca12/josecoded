import { localeSchema } from '@josecoded/types';

import type { Locale } from '@josecoded/types';

// Small helpers shared by the Server Actions of /crm (no 'use server': a file with that directive may only export
// async functions).

export const str = (data: FormData, key: string): string | undefined => {
  const value = data.get(key);
  return typeof value === 'string' ? value : undefined;
};

/** The fields of a form as a plain object, for zod: every string field, missing ones left out. */
export function fieldsOf(data: FormData, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = str(data, key);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function localeOf(data: FormData): Locale {
  return localeSchema.catch('es').parse(str(data, 'locale'));
}

/** What the database says when a rule is broken, as a key of `crm.contacts.errors`. Unknown → `failed`. */
export type ErrorKey =
  | 'failed'
  | 'forbidden'
  | 'quota'
  | 'leadClosed'
  | 'leadWithoutPack'
  | 'nextActionRequired'
  | 'accessAlreadyHas'
  | 'accessInvalidEmail'
  | 'accessEmailStaff'
  | 'accessEmailMustMatch';

export function rpcErrorKey(error: { code?: string; message?: string } | null | undefined): ErrorKey {
  if (!error) return 'failed';
  const message = error.message ?? '';
  const known: readonly [RegExp, ErrorKey][] = [
    [/client_already_has_access/, 'accessAlreadyHas'],
    [/invalid_email/, 'accessInvalidEmail'],
    [/email_is_staff/, 'accessEmailStaff'],
    [/email_must_match_contact/, 'accessEmailMustMatch'],
    [/lead_already_closed_or_missing|lead_not_open/, 'leadClosed'],
    [/lead_without_pack/, 'leadWithoutPack'],
    [/contact_quota_exceeded/, 'quota'],
    [/next_action_required/, 'nextActionRequired'],
  ];
  for (const [pattern, key] of known) if (pattern.test(message)) return key;
  if (error.code === '42501') return 'forbidden';
  return 'failed';
}

/** Kind of organisation a new contact's company gets when it is created from the contact sheet. */
export function organizationKindFor(kind: 'lead' | 'client' | 'agency' | 'recruiter' | 'other') {
  switch (kind) {
    case 'agency':
      return 'agency' as const;
    case 'recruiter':
      return 'recruiter_firm' as const;
    case 'other':
      return 'other' as const;
    default:
      return 'local_business' as const;
  }
}
