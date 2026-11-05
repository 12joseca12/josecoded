import { NextResponse } from "next/server";

import { isOutboxDrainOn } from "@/lib/notifications/config";
import { readOutboxConfig, readWebhookSecret } from "@/lib/outbox/config";
import { secretMatches } from "@/lib/outbox/secret";
import { handleTelegramUpdate } from "@/lib/outbox/webhook";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const secretHeader = "x-telegram-bot-api-secret-token";
const maxBodyBytes = 16_384;
const noStore = { "cache-control": "no-store" };

function reply(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: noStore });
}

export async function POST(request: Request): Promise<Response> {
  if (!(await secretMatches(request.headers.get(secretHeader), readWebhookSecret()))) {
    return reply({ status: "unauthorized" }, 401);
  }
  const client = createSupabaseServiceClient();
  if (client === null) return reply({ status: "not_configured" }, 503);

  const text = await request.text();
  if (text.length > maxBodyBytes) return reply({ status: "too_large" }, 413);
  let update: unknown;
  try {
    update = JSON.parse(text);
  } catch {
    return reply({ status: "ignored" }, 200);
  }

  try {
    const outcome = await handleTelegramUpdate(update, {
      client,
      config: readOutboxConfig(),
      reply: isOutboxDrainOn(),
    });
    return reply({ status: outcome }, 200);
  } catch {
    return reply({ status: "error" }, 500);
  }
}
