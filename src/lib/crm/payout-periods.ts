import type { PayoutCadence } from "@/types/money";

export interface PayoutPeriod {
  start: string;
  end: string;
}

const dayMs = 86_400_000;

function parse(day: string): Date {
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date));
}

function format(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shift(day: string, days: number): string {
  return format(new Date(parse(day).getTime() + days * dayMs));
}

function endOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function suggestPeriod(cadence: PayoutCadence, today: string): PayoutPeriod {
  const date = parse(today);
  if (cadence === "weekly") {
    const weekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
    const thisMonday = shift(today, -(weekday - 1));
    return { start: shift(thisMonday, -7), end: shift(thisMonday, -1) };
  }
  if (cadence === "biweekly") {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    if (date.getUTCDate() >= 16) {
      return {
        start: `${String(year)}-${pad(month + 1)}-01`,
        end: `${String(year)}-${pad(month + 1)}-15`,
      };
    }
    const previous = new Date(Date.UTC(year, month - 1, 1));
    const previousYear = previous.getUTCFullYear();
    const previousMonth = previous.getUTCMonth();
    return {
      start: `${String(previousYear)}-${pad(previousMonth + 1)}-16`,
      end: `${String(previousYear)}-${pad(previousMonth + 1)}-${pad(endOfMonth(previousYear, previousMonth))}`,
    };
  }
  return { start: shift(today, -29), end: today };
}

export function isValidPeriod(period: PayoutPeriod): boolean {
  const start = parse(period.start).getTime();
  const end = parse(period.end).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return end >= start && (end - start) / dayMs <= 366;
}
