import type { Availability } from "@/types/services";

const maxAgeDays = 30;
const dayMs = 24 * 60 * 60 * 1000;

export function loadAvailability(): Promise<Availability | null> {
  return Promise.resolve(null);
}

export function freshAvailability(
  availability: Availability | null,
  now: Date,
): Availability | null {
  if (!availability) return null;
  if (!availability.weeklyHours && !availability.from) return null;
  const updated = Date.parse(availability.updatedAt);
  if (Number.isNaN(updated)) return null;
  const age = now.getTime() - updated;
  if (age < 0 || age > maxAgeDays * dayMs) return null;
  return availability;
}
