import { timingSafeEqual } from "node:crypto";

export const cronSecretHeader = "x-cron-secret";

export interface OverdueRunner {
  rpc: (name: "payments_notify_overdue") => PromiseLike<{ data: number | null; error: unknown }>;
}

export type MoneyCronResult =
  | { status: 200; body: { notified: number } }
  | { status: 401 | 500 | 503; body: { error: string } };

function sameSecret(expected: string, received: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function runMoneyCron(
  secret: string | undefined,
  received: string | null,
  runner: OverdueRunner | null,
): Promise<MoneyCronResult> {
  if (secret === undefined || secret === "" || received === null || !sameSecret(secret, received)) {
    return { status: 401, body: { error: "unauthorized" } };
  }
  if (runner === null) return { status: 503, body: { error: "unavailable" } };
  try {
    const { data, error } = await runner.rpc("payments_notify_overdue");
    if (error || data === null) return { status: 500, body: { error: "failed" } };
    return { status: 200, body: { notified: data } };
  } catch {
    return { status: 500, body: { error: "failed" } };
  }
}
