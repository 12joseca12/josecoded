import { z } from "zod";

export type TurnstileOutcome = "ok" | "rejected" | "unreachable";

export const turnstileAction = "contact";

const siteverifyResponse = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
});

const timeoutMs = 8000;

interface VerifyOptions {
  url: string;
  secret: string;
  token: string;
  ip: string | null;
  allowedHostnames: readonly string[];
  action?: string;
  fetchImpl?: typeof fetch;
}

export async function verifyTurnstile({
  url,
  secret,
  token,
  ip,
  allowedHostnames,
  action: expectedAction = turnstileAction,
  fetchImpl = fetch,
}: VerifyOptions): Promise<TurnstileOutcome> {
  const body = new URLSearchParams({
    secret,
    response: token,
    idempotency_key: crypto.randomUUID(),
  });
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return "unreachable";
    const parsed = siteverifyResponse.safeParse(await response.json());
    if (!parsed.success) return "unreachable";
    const { success, hostname, action } = parsed.data;
    if (!success) return "rejected";
    if (action !== expectedAction) return "rejected";
    if (hostname === undefined || !allowedHostnames.includes(hostname)) return "rejected";
    return "ok";
  } catch {
    return "unreachable";
  }
}
