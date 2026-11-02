// The next action of a contact is stored as an instant (`next_action_at timestamptz`) but typed and read as a
// Madrid wall clock: the team works in Spain, and the server may run anywhere.

const ZONE = 'Europe/Madrid';
/** Hour used when a person picks a day without a time. */
export const DEFAULT_ACTION_TIME = '09:00';

/** Offset of Madrid at a given instant, in minutes east of UTC. */
function madridOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, timeZoneName: 'longOffset' }).formatToParts(at);
  const name = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name);
  if (!match) return 0;
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

/** `2026-11-04` + `10:00` in Madrid, as an ISO instant. */
export function toNextActionAt(date: string, time: string | undefined = DEFAULT_ACTION_TIME): string {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = (time ?? DEFAULT_ACTION_TIME).split(':').map(Number);
  const wall = Date.UTC(year!, month! - 1, day!, hour, minute);
  // the offset depends on the instant itself: take it at the naive guess, then again at the corrected instant
  const first = wall - madridOffsetMinutes(new Date(wall)) * 60_000;
  return new Date(wall - madridOffsetMinutes(new Date(first)) * 60_000).toISOString();
}

/** Day and time of an instant on the Madrid clock, as the inputs of the sheet want them. */
export function toInputParts(iso: string | null): { date: string; time: string } | null {
  if (!iso) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

export type DueState = 'overdue' | 'today' | 'later' | 'none';

/** Same rule as the counters of the database: `next_action_at <= now()` is overdue; later the same Madrid day is «hoy». */
export function dueState(iso: string | null, now: Date = new Date()): DueState {
  if (!iso) return 'none';
  const at = new Date(iso);
  if (at.getTime() <= now.getTime()) return 'overdue';
  return toInputParts(iso)?.date === toInputParts(now.toISOString())?.date ? 'today' : 'later';
}

const DAY_MS = 86_400_000;

/**
 * «hace 3 días» as the overdue lists say it: whole calendar days on the Madrid clock when the date is another day,
 * hours or minutes when it is today. `numeric: 'always'` so a single day reads «hace 1 día», as in the prototype.
 */
export function relativeFromNow(
  iso: string,
  now: Date = new Date(),
  locale: string = 'es',
  style: 'long' | 'short' = 'long',
): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always', style });
  const at = new Date(iso);
  const day = (value: Date) => Date.parse(`${toInputParts(value.toISOString())?.date}T00:00:00Z`);
  const days = Math.round((day(at) - day(now)) / DAY_MS);
  if (days !== 0) return rtf.format(days, 'day');
  const minutes = Math.round((at.getTime() - now.getTime()) / 60_000);
  if (minutes === 0)
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'second');
  return Math.abs(minutes) < 60
    ? rtf.format(minutes, 'minute')
    : rtf.format(Math.round(minutes / 60), 'hour');
}

/**
 * «hoy», «ayer» or «mañana» (in the reader's language) when the instant falls on that Madrid day, `null` for any
 * other day: the caller then writes the date.
 */
export function nearbyDay(
  iso: string,
  now: Date = new Date(),
  locale: string = 'es',
): string | null {
  const day = (value: Date) => Date.parse(`${toInputParts(value.toISOString())?.date}T00:00:00Z`);
  const days = Math.round((day(new Date(iso)) - day(now)) / DAY_MS);
  return Math.abs(days) <= 1
    ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day')
    : null;
}
