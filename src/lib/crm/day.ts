const zone = "Europe/Madrid";
const minute = 60_000;

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: zone,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

function partsOf(date: Date): Record<string, number> {
  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return parts;
}

function offsetMinutes(date: Date): number {
  const p = partsOf(date);
  const local = Date.UTC(p.year ?? 0, (p.month ?? 1) - 1, p.day ?? 1, p.hour, p.minute, p.second);
  return (local - Math.floor(date.getTime() / 1000) * 1000) / minute;
}

function midnight(year: number, month: number, day: number): Date {
  const local = Date.UTC(year, month - 1, day);
  let instant = local;
  for (let step = 0; step < 2; step += 1) {
    instant = local - offsetMinutes(new Date(instant)) * minute;
  }
  return new Date(instant);
}

export interface DayBounds {
  start: Date;
  end: Date;
}

export function madridDayBounds(now: Date): DayBounds {
  const p = partsOf(now);
  const year = p.year ?? 1970;
  const month = p.month ?? 1;
  const day = p.day ?? 1;
  return { start: midnight(year, month, day), end: midnight(year, month, day + 1) };
}
