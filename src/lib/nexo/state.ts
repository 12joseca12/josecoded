import type { NexoEvent, NexoState } from "@/types/nexo";

const stateByEvent: Record<NexoEvent, NexoState> = {
  "visitor-arrived": "greeting",
  typing: "listening",
  "awaiting-reply": "thinking",
  streaming: "talking",
  "reply-finished": "idle",
  "lead-saved": "happy",
  "positive-answer": "happy",
  "low-confidence": "thinking",
  error: "sad",
  "not-interested": "sad",
  "idle-timeout": "idle",
  wake: "idle",
};

export function nexoStateFor(event: NexoEvent): NexoState {
  return stateByEvent[event];
}
