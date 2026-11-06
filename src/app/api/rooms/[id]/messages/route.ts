import { NextResponse } from "next/server";
import { z } from "zod";

import { listRoomMessages } from "@/lib/chat/room";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sinceSchema } from "@/types/room";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

function reply(body: object, status: number) {
  return NextResponse.json(body, { status, headers: noStore });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return reply({ status: "invalid" }, 400);
  const rawSince = new URL(request.url).searchParams.get("since");
  const since = rawSince === null ? null : sinceSchema.safeParse(rawSince);
  if (since !== null && !since.success) return reply({ status: "invalid" }, 400);

  const client = await createSupabaseServerClient();
  if (client === null) return reply({ status: "unavailable" }, 503);
  const claims = await client.auth.getClaims();
  if (claims.error || !claims.data) return reply({ status: "unauthorized" }, 401);

  const result = await listRoomMessages(client, id, since === null ? null : since.data);
  if (result.status === "failed") {
    return reply(result, result.problem === "forbidden" ? 403 : 502);
  }
  return reply(result, 200);
}
