import { describe, expect, it } from 'vitest';

import { dueState, nearbyDay, relativeFromNow, toInputParts, toNextActionAt } from './next-action';

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

describe('relativeFromNow', () => {
  const now = new Date('2026-11-02T10:00:00.000Z');

  it('counts calendar days in Madrid, in the locale of the reader', () => {
    expect(relativeFromNow('2026-10-30T09:00:00.000Z', now, 'es')).toBe('hace 3 días');
    expect(relativeFromNow('2026-10-30T09:00:00.000Z', now, 'en')).toBe('3 days ago');
    expect(relativeFromNow('2026-11-01T22:00:00.000Z', now, 'es')).toBe('hace 1 día');
  });

  it('measures the day on the Madrid clock, not on UTC', () => {
    // 23:30 UTC on the 1st is already the 2nd in Madrid (winter, +1): the same day as «now»
    expect(relativeFromNow('2026-11-01T23:30:00.000Z', now, 'es')).toBe('hace 10 horas');
  });

  it('falls back to hours and minutes within the same day', () => {
    expect(relativeFromNow('2026-11-02T07:00:00.000Z', now, 'es')).toBe('hace 3 horas');
    expect(relativeFromNow('2026-11-02T09:59:00.000Z', now, 'es', 'short')).toBe('hace 1 min');
    expect(relativeFromNow('2026-11-02T10:00:00.000Z', now, 'es')).toBe('ahora');
  });

  it('also reads the future', () => {
    expect(relativeFromNow('2026-11-04T10:00:00.000Z', now, 'es')).toBe('dentro de 2 días');
  });
});

describe('nearbyDay', () => {
  const now = new Date('2026-11-02T10:00:00.000Z');

  it('names yesterday, today and tomorrow in the language of the reader', () => {
    expect(nearbyDay('2026-11-02T09:42:00.000Z', now, 'es')).toBe('hoy');
    expect(nearbyDay('2026-11-01T12:00:00.000Z', now, 'es')).toBe('ayer');
    expect(nearbyDay('2026-11-03T12:00:00.000Z', now, 'en')).toBe('tomorrow');
    expect(nearbyDay('2026-11-02T09:42:00.000Z', now, 'en')).toBe('today');
  });

  it('leaves any other day to the caller', () => {
    expect(nearbyDay('2026-10-30T12:00:00.000Z', now, 'es')).toBeNull();
  });
});
