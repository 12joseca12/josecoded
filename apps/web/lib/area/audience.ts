import type { Database } from '@josecoded/types';

/** The seven faces of the area home (spec D32, DT §1.12, PANT §1.4). */
export type AreaVariant = 'client' | 'proposal' | 'referral' | 'business' | 'company' | 'blog' | 'neutral';

type AudienceSignal = Database['public']['Enums']['audience_signal'];

export interface AreaVariantInput {
  /** The client row of this user (null when they have no project). */
  client: { id: string } | null;
  /** Most recent lead of this user, from `area_lead_summary()` (only with a confirmed email). */
  lead: { pack_code: string } | null;
  profile: { first_audience: AudienceSignal | null } | null;
}

/**
 * Which home the area shows. Priority: a project beats a proposal, a proposal beats the origin
 * signal; the signal (`first_audience`, write-once) only decides between the rest. Origins the area
 * has no tailored face for (client, partner, recruiter, curious) fall to `neutral`. The result
 * only picks the FIRST thing the home puts forward: every variant keeps Recomiéndame, Mi cuenta and
 * the contact route in the shell.
 */
export function resolveAreaVariant({ client, lead, profile }: AreaVariantInput): AreaVariant {
  if (client) return 'client';
  if (lead) return 'proposal';
  switch (profile?.first_audience) {
    case 'referral':
    case 'business':
    case 'company':
    case 'blog':
      return profile.first_audience;
    default:
      return 'neutral';
  }
}
