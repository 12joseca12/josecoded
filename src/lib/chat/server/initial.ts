import "server-only";

import { cookies } from "next/headers";

import type { ChatWireThread } from "@/types/chat-visitor";

import { buildChatRuntime } from "./deps";
import { hashVisitorToken, readVisitorCookie, visitorCookieName } from "./visitor-token";
import { toWireThread } from "./wire";

export async function loadInitialThread(): Promise<ChatWireThread | null> {
  const runtime = buildChatRuntime(process.env);
  if (!runtime) return null;
  const token = await readVisitorCookie(
    (await cookies()).get(visitorCookieName)?.value,
    runtime.deps.cookieSecret,
  );
  if (token === null) return null;
  const outcome = await runtime.deps.rpc.thread(await hashVisitorToken(token), null);
  return outcome.ok ? toWireThread(outcome.data) : null;
}
