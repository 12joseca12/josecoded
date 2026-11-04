export interface RateLimiter {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
}

export interface RateLimitOptions {
  failClosed?: boolean;
  onMissing?: () => void;
}

export async function passesRateLimit(
  limiter: RateLimiter | null,
  key: string,
  { failClosed = false, onMissing }: RateLimitOptions = {},
): Promise<boolean> {
  if (limiter === null) {
    onMissing?.();
    return !failClosed;
  }
  try {
    const { success } = await limiter.limit({ key });
    return success;
  } catch {
    return !failClosed;
  }
}

export async function findContactLimiter(): Promise<RateLimiter | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const candidate = (env as unknown as { CONTACT_LIMITER?: RateLimiter }).CONTACT_LIMITER;
    return candidate ?? null;
  } catch {
    return null;
  }
}
