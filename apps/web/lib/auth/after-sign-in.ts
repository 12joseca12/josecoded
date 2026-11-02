import { recordFirstAudience, resolveAudienceSignal } from '@/lib/area/profile';

import type { ServerSupabase, User } from '@/lib/supabase/server';
import type { OriginAudience } from '@josecoded/types';

/**
 * What happens once per session start, in the OTP action and in the OAuth callback: write the origin
 * signal of the area (write-once) and link an invited client to this account (`claim_client_access`)
 * and an invited closer (`claim_staff_access`); both are idempotent and check the confirmed email inside the
 * database. A failure here never blocks the
 * sign-in: the area can be used without either, and both repeat at the next sign-in.
 */
export async function afterSignIn(
  supabase: ServerSupabase,
  user: Pick<User, 'id'>,
  input: { ref?: string | null; audience?: OriginAudience | null },
): Promise<void> {
  await Promise.allSettled([
    recordFirstAudience(supabase, user.id, resolveAudienceSignal(input)),
    supabase.rpc('claim_client_access'),
    // an invited closer becomes staff here (idempotent; null for anyone without an open invitation)
    supabase.rpc('claim_staff_access'),
  ]);
}
