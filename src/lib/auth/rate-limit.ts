import type { RateLimiter } from "@/lib/contact/rate-limit";

export type AuthLimiterName = "AUTH_LIMITER" | "AUTH_EMAIL_LIMITER";

export async function findAuthLimiter(name: AuthLimiterName): Promise<RateLimiter | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const candidate = (env as unknown as Partial<Record<AuthLimiterName, RateLimiter>>)[name];
    return candidate ?? null;
  } catch {
    return null;
  }
}
