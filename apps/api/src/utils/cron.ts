/**
 * Minimal cron parser for the scheduled-jobs dispatcher (DT §0b). A copy that task 7.3 replaces with
 * `radar-core/src/cron.ts`; same contract: `nextRun(expr, after, tz)`.
 *
 * Five fields (minute hour day-of-month month day-of-week), each `*`, `n`, `a-b`, `a,b,c`, with an optional
 * `/step` (`*\/5`, `0-30/10`). Day-of-week is 0-7 (0 and 7 are Sunday). As in classic cron, when both
 * day-of-month and day-of-week are restricted a day matches if EITHER does.
 */

type Field = { values: Set<number>; star: boolean };

const RANGES: [number, number][] = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
];

function parseField(text: string, [min, max]: [number, number]): Field {
  const values = new Set<number>();
  let star = false;
  for (const part of text.split(',')) {
    const [range = '', stepText] = part.split('/');
    const step = stepText === undefined ? 1 : Number(stepText);
    if (!Number.isInteger(step) || step < 1) throw new Error(`Invalid cron step: ${part}`);
    let from: number;
    let to: number;
    if (range === '*') {
      from = min;
      to = max;
      if (stepText === undefined) star = true;
    } else if (range.includes('-')) {
      const [a = '', b = ''] = range.split('-');
      from = Number(a);
      to = Number(b);
    } else {
      from = Number(range);
      to = stepText === undefined ? from : max;
    }
    if (![from, to].every((n) => Number.isInteger(n) && n >= min && n <= max) || from > to) {
      throw new Error(`Invalid cron field: ${part}`);
    }
    for (let n = from; n <= to; n += step) values.add(n);
  }
  return { values, star };
}

export type ParsedCron = { minute: Field; hour: Field; dom: Field; month: Field; dow: Field };

export function parseCron(expr: string): ParsedCron {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`Cron needs 5 fields: ${expr}`);
  const [minute, hour, dom, month, dow] = parts.map((p, i) => parseField(p, RANGES[i] as [number, number]));
  // 7 is Sunday too
  if (dow && dow.values.has(7)) dow.values.add(0);
  return { minute, hour, dom, month, dow } as ParsedCron;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(tz: string): Intl.DateTimeFormat {
  let fmt = formatters.get(tz);
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'short',
      });
    } catch {
      throw new Error(`Invalid time zone: ${tz}`);
    }
    formatters.set(tz, fmt);
  }
  return fmt;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function localFields(date: Date, fmt: Intl.DateTimeFormat) {
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) out[p.type] = p.value;
  return {
    year: Number(out.year),
    minute: Number(out.minute),
    hour: Number(out.hour),
    dom: Number(out.day),
    month: Number(out.month),
    dow: WEEKDAYS.indexOf(out.weekday ?? ''),
  };
}

type LocalFields = ReturnType<typeof localFields>;

const MINUTE = 60_000;
/**
 * With month and day jumps, a schedule that passes `assertCanFire` fires within this many steps: the rarest one
 * (29 February) needs about 40 steps per year for 8 years. The cap only guards against a bug.
 */
const MAX_STEPS = 5_000;
/** Longest month (leap February); a day-of-month only restriction needs one of its days in a chosen month. */
const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Throws for day/month combinations that never exist (`0 0 30 2 *`), without iterating: when only the
 * day-of-month is restricted, at least one chosen day must fit in at least one chosen month. When day-of-week
 * is restricted too, a day matches if either does, so a weekday always comes round.
 */
function assertCanFire(cron: ParsedCron, expr: string): void {
  if (cron.dom.star || !cron.dow.star) return;
  const smallestDay = Math.min(...cron.dom.values);
  const fits = [...cron.month.values].some((m) => smallestDay <= (MONTH_DAYS[m - 1] ?? 0));
  if (!fits) throw new Error(`Cron never fires: ${expr}`);
}

/** Wall-clock reading of `f` as if it were UTC: subtracting the instant gives the zone offset. */
const wallAsUtc = (f: LocalFields) => Date.UTC(f.year, f.month - 1, f.dom, f.hour, f.minute);

/**
 * First instant at or after local 00:00 of the calendar date `year-month-day` (day may overflow: Date.UTC
 * normalises it). Computed from the zone offset, not by adding 24 h, so 23 h and 25 h days are handled; if
 * that midnight falls in a DST gap, the first existing minute after it is returned.
 */
function localMidnight(year: number, month: number, day: number, fmt: Intl.DateTimeFormat, from: number): number {
  const target = Date.UTC(year, month - 1, day);
  const offsetAt = (t: number) => wallAsUtc(localFields(new Date(t), fmt)) - t;
  const first = target - offsetAt(from);
  const second = target - offsetAt(first);
  // the earliest candidate whose local reading is already on (or past) the target date
  const candidates = [first, second]
    .filter((t) => wallAsUtc(localFields(new Date(t), fmt)) >= target)
    .sort((a, b) => a - b);
  const found = candidates[0] ?? Math.max(first, second);
  // always move forward
  return found > from ? found : from + MINUTE;
}

/** First instant strictly after `after` (to the minute) at which `expr` fires, in time zone `tz`. */
export function nextRun(expr: string, after: Date, tz = 'UTC'): Date {
  const cron = parseCron(expr);
  const fmt = formatterFor(tz);
  assertCanFire(cron, expr);
  let t = Math.floor(after.getTime() / MINUTE) * MINUTE + MINUTE;
  for (let i = 0; i < MAX_STEPS; i++) {
    const f = localFields(new Date(t), fmt);
    const domOk = cron.dom.values.has(f.dom);
    const dowOk = cron.dow.values.has(f.dow);
    const dayOk =
      cron.dom.star || cron.dow.star
        ? domOk && dowOk
        : // both restricted: either matches
          domOk || dowOk;
    if (!cron.month.values.has(f.month)) {
      // local 00:00 of the 1st of the next month, by calendar date
      t = localMidnight(f.year, f.month + 1, 1, fmt, t);
    } else if (!dayOk) {
      // local 00:00 of the next calendar date (not +24 h: DST days have 23 or 25 hours)
      t = localMidnight(f.year, f.month, f.dom + 1, fmt, t);
    } else if (!cron.hour.values.has(f.hour)) {
      t += (60 - f.minute) * MINUTE;
    } else if (!cron.minute.values.has(f.minute)) {
      t += MINUTE;
    } else {
      return new Date(t);
    }
  }
  throw new Error(`Cron never fires within the search window: ${expr}`);
}
