import { createHash, randomUUID } from "node:crypto";

import type { APIRequestContext, BrowserContext } from "@playwright/test";

import { type ChatWireThread, chatWireThreadSchema } from "@/types/chat-visitor";

import { mockOrigin } from "./staff";

export const goodTurnstile = "mock-token:chat";
export const badTurnstile = "bad-token:chat";

export function uniqueText(prefix: string): string {
  return `${prefix} ${randomUUID().slice(0, 8)}`;
}

export async function visitorCookie(source: BrowserContext | APIRequestContext) {
  const { cookies } = await source.storageState();
  return cookies.find((entry) => entry.name === "jc_visitor");
}

export async function visitorTokenHash(
  source: BrowserContext | APIRequestContext,
): Promise<string | null> {
  const cookie = await visitorCookie(source);
  const token = cookie?.value.split(".")[0];
  return token ? createHash("sha256").update(token).digest("hex") : null;
}

export type OmenAction = "online" | "offline" | "reply" | "staff" | "takeover" | "archive";

export async function omen(
  request: APIRequestContext,
  tokenHash: string,
  action: OmenAction,
  extra: { body?: string; sources?: string[] } = {},
) {
  const response = await request.post(`${mockOrigin}/__chat/omen`, {
    data: { tokenHash, action, ...extra },
  });
  if (!response.ok())
    throw new Error(`mock omen ${action} failed with ${String(response.status())}`);
}

export async function getThread(request: APIRequestContext, query = ""): Promise<ChatWireThread> {
  const response = await request.get(`/api/chat/thread${query}`);
  return chatWireThreadSchema.parse(await response.json());
}
