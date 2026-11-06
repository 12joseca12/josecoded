import { cookieOf, ipOf, runtimeOf } from "@/lib/chat/server/route";
import { chatEventStream } from "@/lib/chat/server/stream";
import { hashVisitorToken, readVisitorCookie } from "@/lib/chat/server/visitor-token";
import { chatThreadQuerySchema } from "@/types/chat-visitor";

export const dynamic = "force-dynamic";

const streamHeaders = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-store, no-transform",
  "x-accel-buffering": "no",
};

function status(code: number): Response {
  return new Response(null, { status: code, headers: { "cache-control": "no-store" } });
}

export async function GET(request: Request): Promise<Response> {
  const runtime = runtimeOf();
  if (!runtime) return status(503);
  const { deps } = runtime;
  if (!(await deps.isOn())) return status(404);

  const ipHash = await deps.hashIp(ipOf(request));
  if (!(await deps.rateLimit(`chat:${ipHash}`))) return status(429);

  const token = await readVisitorCookie(cookieOf(request), deps.cookieSecret);
  if (token === null) return status(204);

  const lastEventId = request.headers.get("last-event-id");
  const parsed = chatThreadQuerySchema.safeParse(
    lastEventId === null ? {} : { since: lastEventId },
  );

  return new Response(
    chatEventStream({
      rpc: deps.rpc,
      tokenHash: await hashVisitorToken(token),
      since: parsed.success ? (parsed.data.since ?? null) : null,
      signal: request.signal,
      pollMs: runtime.pollMs,
      maxMs: runtime.maxStreamMs,
      pingEveryMs: runtime.pingEveryMs,
      reportFailure: deps.reportFailure,
    }),
    { headers: streamHeaders },
  );
}
