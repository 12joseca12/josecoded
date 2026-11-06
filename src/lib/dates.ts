const businessZone = "Europe/Madrid";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: businessZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function currentInstant(): Date {
  const forced = process.env.ENABLE_DEV_PAGES === "true" ? process.env.E2E_FAKE_NOW : undefined;
  if (forced) {
    const parsed = new Date(forced);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export function todayInMadrid(instant: Date = currentInstant()): string {
  return dayFormatter.format(instant);
}
