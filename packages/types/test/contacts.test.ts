import { describe, expect, it } from 'vitest';

import { changeStatusInputSchema, closePaidInputSchema, contactListQuerySchema, parseAmount } from '../src/index.ts';

describe('contactListQuerySchema', () => {
  it('reads the filters of the inbox', () => {
    expect(contactListQuerySchema.parse({ kind: 'lead', due: '1', q: '  laura ', page: '2' })).toEqual({
      kind: 'lead',
      due: true,
      q: 'laura',
      page: 2,
    });
  });

  it('drops what does not parse instead of failing: a stale link still opens the inbox', () => {
    expect(contactListQuerySchema.parse({ kind: 'nope', status: 'x', due: '0', owner: 'someone', page: '-3' })).toEqual({});
  });

  it('accepts the three shapes of the owner filter', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    expect(contactListQuerySchema.parse({ owner: 'mine' }).owner).toBe('mine');
    expect(contactListQuerySchema.parse({ owner: 'unassigned' }).owner).toBe('unassigned');
    expect(contactListQuerySchema.parse({ owner: id }).owner).toBe(id);
  });
});

describe('parseAmount', () => {
  it.each([
    ['1400', 1400],
    ['1.400', 1400],
    ['1.400,50', 1400.5],
    ['1400.5', 1400.5],
    [' 900 € ', 900],
    ['0', 0],
  ])('reads %s', (raw, expected) => expect(parseAmount(raw)).toBe(expected));

  it.each([[''], ['abc'], ['-5'], ['1,2,3'], ['12.345,678']])('refuses %s', (raw) => expect(parseAmount(raw)).toBeNull());
});

describe('closePaidInputSchema', () => {
  const lead = '11111111-1111-4111-8111-111111111111';
  it('turns the typed amount into a number and defaults the commission to the RPC rule', () => {
    expect(closePaidInputSchema.parse({ lead_id: lead, contact_id: lead, amount: '1.400' })).toMatchObject({
      amount: 1400,
      commission: 'auto',
    });
  });
  it('validates the pack and treats an empty one as none', () => {
    const base = { lead_id: lead, contact_id: lead, amount: '10' };
    expect(closePaidInputSchema.parse({ ...base, pack_code: 'P2', pack_option: 'pro' })).toMatchObject({ pack_code: 'P2', pack_option: 'pro' });
    expect(closePaidInputSchema.parse({ ...base, pack_code: '', pack_option: '' }).pack_code).toBeUndefined();
    expect(closePaidInputSchema.safeParse({ ...base, pack_code: 'p2; --' }).success).toBe(false);
  });
  it('refuses a missing or bad amount', () => {
    expect(closePaidInputSchema.safeParse({ lead_id: lead, contact_id: lead, amount: 'mucho' }).success).toBe(false);
  });
});

describe('changeStatusInputSchema', () => {
  it('turns an empty next action into undefined', () => {
    const parsed = changeStatusInputSchema.parse({
      contact_id: '11111111-1111-4111-8111-111111111111',
      status: 'won',
      next_action: '  ',
    });
    expect(parsed.next_action).toBeUndefined();
  });
});
