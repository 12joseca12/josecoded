import { describe, expect, it } from 'vitest';

import { buildClosePaidArgs } from './close-paid';

const lead = '11111111-1111-4111-8111-111111111111';

describe('buildClosePaidArgs', () => {
  it('pays a standard affiliate 10 % of the first order', () => {
    expect(buildClosePaidArgs({ leadId: lead, amount: 1400, affiliateLevel: 'standard', commission: 'auto' })).toEqual({
      p_lead_id: lead,
      p_amount: 1400,
      p_generate_reward: true,
      p_reward_type: 'percent',
      p_reward_amount: 140,
      p_reward_percent: 10,
    });
  });

  it('gives a client who recommends months of maintenance, not money', () => {
    const args = buildClosePaidArgs({ leadId: lead, amount: 1400, affiliateLevel: 'client', commission: 'auto' });
    expect(args).toMatchObject({ p_generate_reward: true, p_reward_type: 'maintenance_months' });
    expect(args.p_reward_percent).toBeUndefined();
  });

  it('generates no reward without an affiliate or for a free order', () => {
    expect(buildClosePaidArgs({ leadId: lead, amount: 900, affiliateLevel: null, commission: 'auto' }).p_generate_reward).toBe(false);
    expect(buildClosePaidArgs({ leadId: lead, amount: 0, affiliateLevel: 'standard', commission: 'auto' }).p_generate_reward).toBe(false);
  });

  it('leaves the commission to the RPC unless Jose decides', () => {
    const auto = buildClosePaidArgs({ leadId: lead, amount: 900, affiliateLevel: null, commission: 'auto' });
    expect('p_commission' in auto).toBe(false);
    expect(buildClosePaidArgs({ leadId: lead, amount: 900, affiliateLevel: null, commission: 'yes' }).p_commission).toBe(true);
    expect(buildClosePaidArgs({ leadId: lead, amount: 900, affiliateLevel: null, commission: 'no' }).p_commission).toBe(false);
  });

  it('sends the day of payment when there is one', () => {
    expect(buildClosePaidArgs({ leadId: lead, amount: 900, paidAt: '2026-11-02', affiliateLevel: null, commission: 'auto' }).p_paid_at).toBe(
      '2026-11-02T12:00:00.000Z',
    );
  });
});
