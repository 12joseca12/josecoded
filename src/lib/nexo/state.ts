import type { NexoEvent, NexoState } from "@/types/nexo";

const stateByEvent: Record<NexoEvent, NexoState> = {
  "visitor-arrived": "greeting",
  typing: "listening",
  "awaiting-reply": "thinking",
  streaming: "talking",
  "reply-finished": "idle",
  "lead-saved": "happy",
  "positive-answer": "happy",
  "low-confidence": "confused",
  error: "sad",
  "not-interested": "sad",
  "idle-timeout": "sleeping",
  wake: "idle",
};

export function nexoStateFor(event: NexoEvent): NexoState {
  return stateByEvent[event];
}
