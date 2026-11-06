import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { signChatUrl } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ status: "invalid" }, { status: 400, headers: noStore });
  }
  const client = await createSupabaseServerClient();
  const service = createSupabaseServiceClient();
  if (client === null || service === null) {
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers: noStore });
  }
  const { data } = await client
    .from("message_attachments")
    .select("storage_path, name")
    .eq("id", id)
    .maybeSingle();
  if (!data) return NextResponse.json({ status: "missing" }, { status: 404, headers: noStore });
  const url = await signChatUrl(service, data.storage_path, data.name);
  if (url === null)
    return NextResponse.json({ status: "error" }, { status: 502, headers: noStore });
  return NextResponse.redirect(url, { status: 302, headers: noStore });
}
