import { describe, expect, it } from 'vitest';

import { nextRun, parseCron } from './cron';

const iso = (d: Date) => d.toISOString();

describe('nextRun in UTC', () => {
  it.each([
    ['*/5 * * * *', '2026-05-04T10:02:30.000Z', '2026-05-04T10:05:00.000Z'],
    // strictly after: an exact boundary moves to the next one
    ['*/5 * * * *', '2026-05-04T10:05:00.000Z', '2026-05-04T10:10:00.000Z'],
    ['0 * * * *', '2026-05-04T10:00:00.000Z', '2026-05-04T11:00:00.000Z'],
    ['0 */6 * * *', '2026-05-04T10:00:00.000Z', '2026-05-04T12:00:00.000Z'],
    ['0 6,7 * * *', '2026-05-04T06:30:00.000Z', '2026-05-04T07:00:00.000Z'],
    ['0 6,7 * * *', '2026-05-04T07:00:00.000Z', '2026-05-05T06:00:00.000Z'],
    ['0-30/10 * * * *', '2026-05-04T10:11:00.000Z', '2026-05-04T10:20:00.000Z'],
    // Monday 09:00 (2026-05-04 is a Monday)
    ['0 9 * * 1', '2026-05-04T09:00:00.000Z', '2026-05-11T09:00:00.000Z'],
    // 7 is Sunday as well as 0
    ['0 9 * * 7', '2026-05-04T09:00:00.000Z', '2026-05-10T09:00:00.000Z'],
    ['0 9 * * 0', '2026-05-04T09:00:00.000Z', '2026-05-10T09:00:00.000Z'],
    // month rollover and leap day
    ['0 0 1 * *', '2026-05-04T00:00:00.000Z', '2026-06-01T00:00:00.000Z'],
    ['0 0 29 2 *', '2026-05-04T00:00:00.000Z', '2028-02-29T00:00:00.000Z'],
  ])('%s after %s -> %s', (expr, after, expected) => {
    expect(iso(nextRun(expr, new Date(after)))).toBe(expected);
  });

  it('day-of-month and day-of-week both restricted: either matches (classic cron)', () => {
    // the 1st OR a Monday: from Tue 2026-05-05 the next is Monday 2026-05-11, not 2026-06-01
    expect(iso(nextRun('0 0 1 * 1', new Date('2026-05-05T00:00:00.000Z')))).toBe('2026-05-11T00:00:00.000Z');
  });
});

describe('nextRun with a time zone (radar.daily at 08:00 Europe/Madrid)', () => {
  const daily = '0 8 * * *';
  const tz = 'Europe/Madrid';

  it('follows CET and CEST: 07:00Z in winter, 06:00Z in summer', () => {
    expect(iso(nextRun(daily, new Date('2026-01-15T00:00:00.000Z'), tz))).toBe('2026-01-15T07:00:00.000Z');
    expect(iso(nextRun(daily, new Date('2026-07-15T00:00:00.000Z'), tz))).toBe('2026-07-15T06:00:00.000Z');
  });

  it('crosses the spring change (2026-03-29) without skipping or doubling a day', () => {
    const before = nextRun(daily, new Date('2026-03-28T07:30:00.000Z'), tz);
    expect(iso(before)).toBe('2026-03-29T06:00:00.000Z');
    const after = nextRun(daily, before, tz);
    expect(iso(after)).toBe('2026-03-30T06:00:00.000Z');
  });

  it('crosses the autumn change (2026-10-25)', () => {
    expect(iso(nextRun(daily, new Date('2026-10-24T07:00:00.000Z'), tz))).toBe('2026-10-25T07:00:00.000Z');
  });
});

describe('invalid expressions', () => {
  it.each(['* * * *', '61 * * * *', '* 24 * * *', '*/0 * * * *', 'a * * * *', '5-1 * * * *', '* * 0 * *'])(
    '%s throws',
    (expr) => {
      expect(() => parseCron(expr)).toThrow();
    },
  );
});
