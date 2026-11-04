import type { RateLimiter } from "@/lib/contact/rate-limit";

export async function findAuthLimiter(): Promise<RateLimiter | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const candidate = (env as unknown as { AUTH_LIMITER?: RateLimiter }).AUTH_LIMITER;
    return candidate ?? null;
  } catch {
    return null;
  }
}
