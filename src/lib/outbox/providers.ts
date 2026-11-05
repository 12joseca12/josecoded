import type { EmailMessage, ResendConfig, SendResult, TelegramConfig } from "@/types/outbox";

type FetchLike = typeof fetch;

export const requestTimeoutMs = 8000;
const errorLimit = 300;

const jsonHeaders = { "content-type": "application/json" };

function isTransient(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function clip(value: string): string {
  return value.length > errorLimit ? `${value.slice(0, errorLimit)}…` : value;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await response.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function describe(prefix: string, status: number, body: Record<string, unknown>, key: string) {
  const detail = body[key];
  return clip(
    typeof detail === "string" && detail !== ""
      ? `${prefix}_${status}: ${detail}`
      : `${prefix}_${status}`,
  );
}

export async function sendEmail(
  config: ResendConfig,
  message: EmailMessage,
  idempotencyKey: string,
  fetchImpl: FetchLike = fetch,
): Promise<SendResult> {
  try {
    const response = await fetchImpl(`${config.baseUrl}/emails`, {
      method: "POST",
      headers: {
        ...jsonHeaders,
        authorization: `Bearer ${config.apiKey}`,
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({
        from: config.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    if (response.ok) return { ok: true };
    const body = await readJson(response);
    return {
      ok: false,
      transient: isTransient(response.status),
      error: describe("resend", response.status, body, "message"),
    };
  } catch {
    return { ok: false, transient: true, error: "resend_network_error" };
  }
}

export async function sendTelegram(
  config: TelegramConfig,
  chatId: string,
  text: string,
  fetchImpl: FetchLike = fetch,
): Promise<SendResult> {
  try {
    const response = await fetchImpl(`${config.baseUrl}/bot${config.token}/sendMessage`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    const body = await readJson(response);
    if (response.ok && body.ok !== false) return { ok: true };
    const parameters = body.parameters;
    const retryAfter =
      typeof parameters === "object" && parameters !== null
        ? (parameters as Record<string, unknown>).retry_after
        : undefined;
    return {
      ok: false,
      transient: isTransient(response.status),
      ...(typeof retryAfter === "number" ? { retryAfterMs: retryAfter * 1000 } : {}),
      error: describe("telegram", response.status, body, "description"),
    };
  } catch {
    return { ok: false, transient: true, error: "telegram_network_error" };
  }
}
