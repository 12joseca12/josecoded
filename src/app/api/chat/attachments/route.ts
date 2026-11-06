import { NextResponse } from "next/server";
import { z } from "zod";

import { sendWithAttachments } from "@/lib/chat/attachment-send";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

function reply(body: object, status: number) {
  return NextResponse.json(body, { status, headers: noStore });
}

const fieldsSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().max(4000),
});

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin !== null && origin !== new URL(request.url).origin) {
    return reply({ status: "failed", problem: "forbidden" }, 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply({ status: "failed", problem: "invalid" }, 400);
  }
  const fields = fieldsSchema.safeParse({
    conversationId: form.get("conversationId"),
    body: form.get("body") ?? "",
  });
  const files = form.getAll("files").filter((entry): entry is File => entry instanceof File);
  if (!fields.success || files.length === 0) {
    return reply({ status: "failed", problem: "invalid" }, 400);
  }

  const client = await createSupabaseServerClient();
  const service = createSupabaseServiceClient();
  if (client === null || service === null) return reply({ status: "unavailable" }, 503);
  const claims = await client.auth.getClaims();
  const userId = claims.data?.claims.sub;
  if (claims.error || typeof userId !== "string") {
    return reply({ status: "failed", problem: "forbidden" }, 401);
  }

  const result = await sendWithAttachments(client, service, userId, { ...fields.data, files });
  if (result.status === "done") return reply(result, 200);
  const status =
    result.problem === "forbidden"
      ? 403
      : result.problem === "error" || result.problem === "attachments_failed"
        ? 502
        : 400;
  return reply(result, status);
}
