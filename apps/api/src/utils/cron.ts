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

function localFields(date: Date, tz: string) {
  let fmt = formatters.get(tz);
  if (!fmt) {
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
    formatters.set(tz, fmt);
  }
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) out[p.type] = p.value;
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    minute: Number(out.minute),
    hour: Number(out.hour),
    dom: Number(out.day),
    month: Number(out.month),
    dow: weekdays.indexOf(out.weekday ?? ''),
  };
}

const MINUTE = 60_000;
const MAX_STEPS = 200_000;

/** First instant strictly after `after` (to the minute) at which `expr` fires, in time zone `tz`. */
export function nextRun(expr: string, after: Date, tz = 'UTC'): Date {
  const cron = parseCron(expr);
  let t = Math.floor(after.getTime() / MINUTE) * MINUTE + MINUTE;
  for (let i = 0; i < MAX_STEPS; i++) {
    const f = localFields(new Date(t), tz);
    const domOk = cron.dom.values.has(f.dom);
    const dowOk = cron.dow.values.has(f.dow);
    const dayOk =
      cron.dom.star || cron.dow.star
        ? domOk && dowOk
        : // both restricted: either matches
          domOk || dowOk;
    if (!cron.month.values.has(f.month) || !dayOk) {
      // jump to the next local midnight (re-checked on arrival, so DST shifts cannot skip a match)
      t += (24 * 60 - (f.hour * 60 + f.minute)) * MINUTE;
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
