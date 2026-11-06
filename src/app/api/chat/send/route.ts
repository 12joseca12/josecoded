import { processSend } from "@/lib/chat/server/process";
import {
  cookieOf,
  ipOf,
  isSecureOrigin,
  readJson,
  respond,
  runtimeOf,
} from "@/lib/chat/server/route";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const result = await processSend(
    await readJson(request),
    { ip: ipOf(request), cookie: cookieOf(request) },
    runtimeOf()?.deps ?? null,
  );
  return respond(result, isSecureOrigin(request));
}
