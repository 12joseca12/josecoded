import { computeAffiliateReward } from '@josecoded/pricing';

import type { AffiliateLevel } from '@josecoded/pricing';
import type { Database } from '@josecoded/types';

type CloseArgs = Database['public']['Functions']['admin_close_lead_paid']['Args'];

export interface ClosePaidInput {
  leadId: string;
  /** What was charged, without VAT. */
  amount: number;
  /** `YYYY-MM-DD`; today when absent. */
  paidAt?: string;
  /** Level of the lead's affiliate, or `null` when the lead came without one. */
  affiliateLevel: AffiliateLevel | null;
  /**
   * Jose's call on the owner closer's commission. `auto` leaves it to the RPC (it is created only when the closer
   * opened the lead himself), `yes`/`no` force it (DATOS §14.13 A1).
   */
  commission: 'auto' | 'yes' | 'no';
}

/**
 * Arguments of `admin_close_lead_paid`. The affiliate reward is computed here with the single rule of
 * `@josecoded/pricing` (level × first order) and sent as data: the database stores what the admin confirmed. A
 * reward of 0 would break the check `amount > 0`, so a free order generates none.
 */
export function buildClosePaidArgs(input: ClosePaidInput): CloseArgs {
  const args: CloseArgs = { p_lead_id: input.leadId, p_amount: input.amount };
  if (input.paidAt) args.p_paid_at = `${input.paidAt}T12:00:00.000Z`;
  if (input.commission !== 'auto') args.p_commission = input.commission === 'yes';

  if (input.affiliateLevel === null) {
    args.p_generate_reward = false;
    return args;
  }
  const reward = computeAffiliateReward(input.affiliateLevel, input.amount);
  if (reward.amount <= 0) {
    args.p_generate_reward = false;
    return args;
  }
  args.p_generate_reward = true;
  args.p_reward_type = reward.type;
  args.p_reward_amount = reward.amount;
  if (reward.type === 'percent') args.p_reward_percent = reward.percent;
  return args;
}
