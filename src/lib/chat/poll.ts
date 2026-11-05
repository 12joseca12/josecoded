const defaultPollMs = 4000;

export function roomPollMs(env: Record<string, string | undefined> = process.env): number {
  const raw = Number(env.E2E_ROOM_POLL_MS);
  if (Number.isInteger(raw) && raw >= 200 && raw <= 60_000) return raw;
  return defaultPollMs;
}
