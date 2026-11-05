import { processThread } from "@/lib/chat/server/process";
import { cookieOf, ipOf, isSecureOrigin, respond, runtimeOf } from "@/lib/chat/server/route";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const since = new URL(request.url).searchParams.get("since");
  const result = await processThread(
    since === null ? {} : { since },
    { ip: ipOf(request), cookie: cookieOf(request) },
    runtimeOf()?.deps ?? null,
  );
  return respond(result, isSecureOrigin(request));
}
