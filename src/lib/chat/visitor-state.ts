import type { ChatStatus } from "@/types/chat";
import type { NexoEvent, NexoState } from "@/types/nexo";

import { nexoStateFor } from "../nexo/state";

export interface VisitorStateInput {
  status: ChatStatus;
  drafting: boolean;
  sending: boolean;
  speaking: boolean;
  failed: boolean;
  fresh: boolean;
  leadSaved: boolean;
}

export function visitorNexoEvent(input: VisitorStateInput): NexoEvent {
  const { status } = input;
  if (input.failed || status.quotaExceeded) return "error";
  if (!status.aiEnabled || !status.nexoOnline) return "idle-timeout";
  if (input.speaking) return "streaming";
  if (input.sending || status.pendingReply) return "awaiting-reply";
  if (input.drafting) return "typing";
  if (input.leadSaved) return "lead-saved";
  if (input.fresh) return "visitor-arrived";
  return "reply-finished";
}

export function visitorNexoState(input: VisitorStateInput): NexoState {
  return nexoStateFor(visitorNexoEvent(input));
}
