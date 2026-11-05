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

async function findLimiter(name: string): Promise<RateLimiter | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const candidate = (env as unknown as Record<string, RateLimiter | undefined>)[name];
    return candidate ?? null;
  } catch {
    return null;
  }
}

export function findContactLimiter(): Promise<RateLimiter | null> {
  return findLimiter("CONTACT_LIMITER");
}

export function findChatLimiter(): Promise<RateLimiter | null> {
  return findLimiter("CHAT_LIMITER");
}

export function passesChatRateLimit(
  limiter: RateLimiter | null,
  key: string,
  loopback: boolean,
): Promise<boolean> {
  return passesRateLimit(limiter, key, {
    failClosed: !loopback,
    onMissing: () => {
      if (!loopback) console.error("limiter_missing", "CHAT_LIMITER");
    },
  });
}

export function passesContactRateLimit(
  limiter: RateLimiter | null,
  key: string,
  loopback: boolean,
): Promise<boolean> {
  return passesRateLimit(limiter, key, {
    failClosed: !loopback,
    onMissing: () => {
      if (!loopback) console.error("limiter_missing", "CONTACT_LIMITER");
    },
  });
}
