import { describe, expect, it } from 'vitest';

import { dueState, toInputParts, toNextActionAt } from './next-action';

describe('toNextActionAt', () => {
  it('uses the winter offset of Madrid in November', () => {
    expect(toNextActionAt('2026-11-04', '10:00')).toBe('2026-11-04T09:00:00.000Z');
  });
  it('uses the summer offset in July', () => {
    expect(toNextActionAt('2026-07-15', '10:00')).toBe('2026-07-15T08:00:00.000Z');
  });
  it('defaults to nine in the morning', () => {
    expect(toNextActionAt('2026-11-04')).toBe('2026-11-04T08:00:00.000Z');
  });
  it('is right around the change of hour', () => {
    expect(toNextActionAt('2026-10-25', '12:00')).toBe('2026-10-25T11:00:00.000Z');
    expect(toNextActionAt('2026-03-29', '12:00')).toBe('2026-03-29T10:00:00.000Z');
  });
});

describe('toInputParts', () => {
  it('gives back what toNextActionAt took', () => {
    expect(toInputParts('2026-11-04T09:00:00.000Z')).toEqual({ date: '2026-11-04', time: '10:00' });
  });
  it('is null without a date', () => expect(toInputParts(null)).toBeNull());
});

describe('dueState', () => {
  const now = new Date('2026-11-02T10:00:00.000Z');
  it('is overdue from the instant on, like the counters of the database', () => {
    expect(dueState('2026-11-02T10:00:00.000Z', now)).toBe('overdue');
    expect(dueState('2026-10-30T09:00:00.000Z', now)).toBe('overdue');
  });
  it('is «hoy» later the same day in Madrid', () => {
    expect(dueState('2026-11-02T16:00:00.000Z', now)).toBe('today');
  });
  it('is later from tomorrow, and none without a date', () => {
    expect(dueState('2026-11-03T09:00:00.000Z', now)).toBe('later');
    expect(dueState(null, now)).toBe('none');
  });
});
