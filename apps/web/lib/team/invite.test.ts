import { describe, expect, it } from 'vitest';

import { inviteIdSchema, inviteStaffSchema, reassignContactsSchema, setRateSchema, setStaffSchema } from './invite';

const id = '11111111-1111-4111-8111-111111111111';

describe('inviteStaffSchema', () => {
  it('lowercases and trims the email and reads the rate with a comma', () => {
    expect(inviteStaffSchema.parse({ email: '  Clara.Nieto@Correo.TEST ', role: 'closer', rate: '12,5' })).toEqual({
      email: 'clara.nieto@correo.test',
      role: 'closer',
      rate: 12.5,
    });
  });

  it('requires the rate (Q21): empty or missing is an error, never a silent 0', () => {
    expect(inviteStaffSchema.safeParse({ email: 'a@b.test', role: 'closer', rate: '' }).success).toBe(false);
    expect(inviteStaffSchema.safeParse({ email: 'a@b.test', role: 'closer' }).success).toBe(false);
  });

  it('accepts the bounds 0 and 100 and refuses anything outside or malformed', () => {
    const parse = (rate: string) => inviteStaffSchema.safeParse({ email: 'a@b.test', role: 'closer', rate }).success;
    expect(parse('0')).toBe(true);
    expect(parse('100')).toBe(true);
    for (const bad of ['100,01', '101', '-1', '1e1', '10%', '1.234', 'abc', '1 0']) expect(parse(bad)).toBe(false);
  });

  it('refuses a bad email and any role but closer (nobody is invited as admin)', () => {
    expect(inviteStaffSchema.safeParse({ email: 'no-at', role: 'closer', rate: '10' }).success).toBe(false);
    expect(inviteStaffSchema.safeParse({ email: 'a@b.test', role: 'admin', rate: '10' }).success).toBe(false);
  });
});

describe('the other schemas', () => {
  it('invite id must be a uuid', () => {
    expect(inviteIdSchema.safeParse({ id }).success).toBe(true);
    expect(inviteIdSchema.safeParse({ id: 'x' }).success).toBe(false);
  });

  it('setStaff reads "true" / "false" and nothing else', () => {
    expect(setStaffSchema.parse({ id, disabled: 'true' }).disabled).toBe(true);
    expect(setStaffSchema.parse({ id, disabled: 'false' }).disabled).toBe(false);
    expect(setStaffSchema.safeParse({ id, disabled: 'yes' }).success).toBe(false);
  });

  it('setRate and reassign need uuids and a bounded rate', () => {
    expect(setRateSchema.parse({ user_id: id, rate: '15' }).rate).toBe(15);
    expect(setRateSchema.safeParse({ user_id: id, rate: '101' }).success).toBe(false);
    expect(reassignContactsSchema.safeParse({ from: id, to: id }).success).toBe(true);
    expect(reassignContactsSchema.safeParse({ from: id, to: '' }).success).toBe(false);
  });
});
