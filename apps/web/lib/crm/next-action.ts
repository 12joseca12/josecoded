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
