import { isValidCode } from '@josecoded/pricing';

import type { ServerSupabase } from '@/lib/supabase/server';
import type { OriginAudience } from '@josecoded/types';

/**
 * Origin signal of the client area (DT §1.12, spec D32). `referral` comes from the `ref` cookie and
 * wins over the audience a public page carried in the sign-up (`business`, `company`, `blog`).
 */
export interface AudienceSignalInput {
  audience: 'referral' | OriginAudience;
  source: 'ref' | 'origin';
}

export function resolveAudienceSignal(input: {
  ref?: string | null;
  audience?: OriginAudience | null;
}): AudienceSignalInput | null {
  if (input.ref && isValidCode(input.ref)) return { audience: 'referral', source: 'ref' };
  if (input.audience) return { audience: input.audience, source: 'origin' };
  return null;
}

/**
 * Stores the first audience of the user. The row of `user_profiles` already exists (the trigger
 * `handle_new_user` creates it) and the column is write-once: the `is null` filter makes a repeat a
 * no-op, and the database trigger refuses a change anyway. The grant only allows the user's own row.
 */
export async function recordFirstAudience(
  supabase: Pick<ServerSupabase, 'from'>,
  userId: string,
  signal: AudienceSignalInput | null,
): Promise<void> {
  if (!signal) return;
  await supabase
    .from('user_profiles')
    .update({ first_audience: signal.audience, first_audience_source: signal.source })
    .eq('user_id', userId)
    .is('first_audience', null);
}
