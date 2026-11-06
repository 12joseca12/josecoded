"use server";

import { z } from "zod";

import { getSessionState } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { memberRoles, type RoomActionResult, type SendRoomMessageResult } from "@/types/room";

import {
  addRoomMember,
  archiveRoom,
  markRoomRead,
  removeRoomMember,
  sendRoomMessage,
  setAiConsent,
  setConversationAi,
} from "./room";

const failed = (code: string): RoomActionResult => ({ status: "failed", code });
const id = z.uuid();

async function session() {
  const state = await getSessionState();
  if (state?.status !== "member") return null;
  const client = await createSupabaseServerClient();
  if (client === null) return null;
  return { state, client };
}

export async function sendRoomMessageAction(raw: unknown): Promise<SendRoomMessageResult> {
  const context = await session();
  if (context === null) return { status: "failed", problem: "forbidden" };
  return sendRoomMessage(context.client, context.state.userId, raw);
}

export async function markRoomReadAction(conversationId: string): Promise<void> {
  const context = await session();
  if (context === null || !id.safeParse(conversationId).success) return;
  await markRoomRead(context.client, conversationId);
}

export async function setConversationAiAction(
  conversationId: string,
  enabled: boolean,
): Promise<RoomActionResult> {
  const context = await session();
  if (context === null || !id.safeParse(conversationId).success) return failed("forbidden");
  return setConversationAi(context.client, conversationId, enabled);
}

export async function setAiConsentAction(
  conversationId: string,
  granted: boolean,
): Promise<RoomActionResult> {
  const context = await session();
  if (context === null || !id.safeParse(conversationId).success) return failed("forbidden");
  return setAiConsent(context.client, conversationId, granted);
}

export async function archiveRoomAction(conversationId: string): Promise<RoomActionResult> {
  const context = await session();
  if (context === null || !id.safeParse(conversationId).success) return failed("forbidden");
  return archiveRoom(context.client, conversationId);
}

export async function addRoomMemberAction(
  conversationId: string,
  userId: string,
  role: string,
): Promise<RoomActionResult> {
  const context = await session();
  const parsedRole = z.enum(memberRoles).safeParse(role);
  if (
    context === null ||
    !id.safeParse(conversationId).success ||
    !id.safeParse(userId).success ||
    !parsedRole.success
  ) {
    return failed("forbidden");
  }
  return addRoomMember(context.client, conversationId, userId, parsedRole.data);
}

export async function removeRoomMemberAction(
  conversationId: string,
  userId: string,
): Promise<RoomActionResult> {
  const context = await session();
  if (context === null || !id.safeParse(conversationId).success || !id.safeParse(userId).success) {
    return failed("forbidden");
  }
  return removeRoomMember(context.client, conversationId, userId);
}
