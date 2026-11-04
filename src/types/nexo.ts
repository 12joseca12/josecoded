export const nexoStates = [
  "idle",
  "greeting",
  "listening",
  "thinking",
  "talking",
  "happy",
  "sad",
] as const;
export type NexoState = (typeof nexoStates)[number];

export const nexoSizes = ["xs", "sm", "md", "lg", "xl"] as const;
export type NexoSize = (typeof nexoSizes)[number];

export const nexoEvents = [
  "visitor-arrived",
  "typing",
  "awaiting-reply",
  "streaming",
  "reply-finished",
  "lead-saved",
  "positive-answer",
  "low-confidence",
  "error",
  "not-interested",
  "idle-timeout",
  "wake",
] as const;
export type NexoEvent = (typeof nexoEvents)[number];
