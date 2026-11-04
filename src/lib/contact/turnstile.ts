import { z } from "zod";

export type TurnstileOutcome = "ok" | "rejected" | "unreachable";

const siteverifyResponse = z.object({ success: z.boolean() });

const timeoutMs = 8000;

interface VerifyOptions {
  url: string;
  secret: string;
  token: string;
  ip: string | null;
  fetchImpl?: typeof fetch;
}

export async function verifyTurnstile({
  url,
  secret,
  token,
  ip,
  fetchImpl = fetch,
}: VerifyOptions): Promise<TurnstileOutcome> {
  const body = new URLSearchParams({ secret, response: token });
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
    return parsed.data.success ? "ok" : "rejected";
  } catch {
    return "unreachable";
  }
}
