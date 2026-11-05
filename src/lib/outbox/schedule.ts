export interface ScheduleEnv {
  OUTBOX_DRAIN?: string;
  CRON_SECRET?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

export const cronPath = "/api/cron/outbox";
export const cronHeader = "x-cron-secret";

const fallbackOrigin = "https://josecoded.com";

function originOf(value: string | undefined): string {
  try {
    return new URL(value ?? "").origin;
  } catch {
    return fallbackOrigin;
  }
}

export function buildCronRequest(env: ScheduleEnv): Request | null {
  if (env.OUTBOX_DRAIN?.trim() !== "on") return null;
  const secret = env.CRON_SECRET?.trim();
  if (!secret) return null;
  return new Request(`${originOf(env.NEXT_PUBLIC_SITE_URL)}${cronPath}`, {
    method: "POST",
    headers: { [cronHeader]: secret },
  });
}
