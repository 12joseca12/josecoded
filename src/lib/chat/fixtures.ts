import type { ChatMessage, ChatSendError, ChatStatus, HandoffPhase } from "@/types/chat";

export const chatScenarios = [
  "fresh",
  "conversation",
  "thinking",
  "offline",
  "takeover",
  "quota",
  "handoff",
  "failed",
] as const;
export type ChatScenario = (typeof chatScenarios)[number];

export interface ChatFixture {
  messages: ChatMessage[];
  status: ChatStatus;
  handoff: HandoffPhase;
  sendError: ChatSendError | null;
}

const onlineStatus: ChatStatus = {
  nexoOnline: true,
  aiEnabled: true,
  pendingReply: false,
  handoffDone: false,
  quotaExceeded: false,
  connection: "online",
};

function message(
  id: string,
  variant: ChatMessage["variant"],
  body: string,
  extra: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id,
    variant,
    body,
    authorName: null,
    sources: [],
    createdAt: "2026-11-05T10:00:00+00:00",
    systemEvent: null,
    delivery: "sent",
    ...extra,
  };
}

const exchange: ChatMessage[] = [
  message("m1", "visitor", "Necesito una web con área de clientes."),
  message(
    "m2",
    "nexo",
    "Eso encaja con el servicio a medida. ¿Tienes ya el diseño o partimos de cero?",
    {
      sources: ["Servicios › A medida"],
    },
  ),
];

export function chatFixture(scenario: ChatScenario): ChatFixture {
  switch (scenario) {
    case "fresh":
      return { messages: [], status: onlineStatus, handoff: "hidden", sendError: null };
    case "conversation":
      return { messages: exchange, status: onlineStatus, handoff: "hidden", sendError: null };
    case "thinking":
      return {
        messages: exchange.slice(0, 1),
        status: { ...onlineStatus, pendingReply: true },
        handoff: "hidden",
        sendError: null,
      };
    case "offline":
      return {
        messages: [message("m1", "visitor", "¿Podéis ayudarme con una app?")],
        status: { ...onlineStatus, nexoOnline: false },
        handoff: "offered",
        sendError: null,
      };
    case "takeover":
      return {
        messages: [
          ...exchange,
          message("m3", "system", "", { systemEvent: "ai_off" }),
          message("m4", "staff", "Hola, soy Jose. Cuéntame más y lo vemos.", {
            authorName: "Jose",
          }),
        ],
        status: { ...onlineStatus, aiEnabled: false },
        handoff: "hidden",
        sendError: null,
      };
    case "quota":
      return {
        messages: exchange,
        status: { ...onlineStatus, quotaExceeded: true },
        handoff: "hidden",
        sendError: null,
      };
    case "handoff":
      return {
        messages: [...exchange, message("m3", "system", "", { systemEvent: "handoff_done" })],
        status: { ...onlineStatus, handoffDone: true },
        handoff: "done",
        sendError: null,
      };
    case "failed":
      return {
        messages: [message("m1", "visitor", "Hola", { delivery: "failed" })],
        status: onlineStatus,
        handoff: "hidden",
        sendError: "unavailable",
      };
  }
}
