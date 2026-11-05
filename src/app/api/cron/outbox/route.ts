import { NextResponse } from "next/server";

import { site } from "@/config/site";
import { isOutboxDrainOn } from "@/lib/notifications/config";
import { readCronSecret, readOutboxConfig } from "@/lib/outbox/config";
import { drainOutbox } from "@/lib/outbox/drain";
import { cronHeader } from "@/lib/outbox/schedule";
import { secretMatches } from "@/lib/outbox/secret";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

function reply(body: object, status: number) {
  return NextResponse.json(body, { status, headers: noStore });
}

export async function POST(request: Request): Promise<Response> {
  if (!(await secretMatches(request.headers.get(cronHeader), readCronSecret()))) {
    return reply({ status: "unauthorized" }, 401);
  }
  if (!isOutboxDrainOn()) return reply({ status: "off" }, 200);

  const config = readOutboxConfig();
  const client = createSupabaseServiceClient();
  if (client === null || (config.resend === null && config.telegram === null)) {
    return reply({ status: "not_configured" }, 503);
  }

  const result = await drainOutbox({ client, config, origin: site.origin });
  if (result.status === "claim_failed") return reply({ status: "claim_failed" }, 502);
  return reply(result, 200);
}
