import "@/lib/security/zod-jitless";

import { z } from "zod";

export const chatBubbleVariants = ["visitor", "nexo", "staff", "system"] as const;
export type ChatBubbleVariant = (typeof chatBubbleVariants)[number];

export const chatSystemEvents = ["ai_off", "ai_on", "handoff_done", "archived"] as const;
export type ChatSystemEvent = (typeof chatSystemEvents)[number];

export const chatNoticeVariants = ["takeover", "offline", "quota"] as const;
export type ChatNoticeVariant = (typeof chatNoticeVariants)[number];

export const chatStarterTopics = ["default", "services", "freelance", "about", "contact"] as const;
export type ChatStarterTopic = (typeof chatStarterTopics)[number];

export const chatMaxLength = 2000;
export const chatMaxLines = 6;

export interface ChatMessage {
  id: string;
  variant: ChatBubbleVariant;
  body: string;
  authorName: string | null;
  sources: string[];
  createdAt: string;
  systemEvent: ChatSystemEvent | null;
  delivery: "sent" | "sending" | "failed";
}

export const chatConnections = ["online", "reconnecting", "offline"] as const;
export type ChatConnection = (typeof chatConnections)[number];

export interface ChatStatus {
  nexoOnline: boolean;
  aiEnabled: boolean;
  pendingReply: boolean;
  handoffDone: boolean;
  quotaExceeded: boolean;
  connection: ChatConnection;
}

export const handoffPhases = ["hidden", "offered", "sending", "done"] as const;
export type HandoffPhase = (typeof handoffPhases)[number];

export const chatSendErrors = [
  "quota",
  "closed",
  "verification",
  "invalid",
  "unavailable",
] as const;
export type ChatSendError = (typeof chatSendErrors)[number];

export const handoffFieldNames = ["name", "email", "phone", "consent"] as const;
export type HandoffFieldName = (typeof handoffFieldNames)[number];
export type HandoffFieldErrors = Partial<Record<HandoffFieldName, string>>;

export interface HandoffState {
  phase: HandoffPhase;
  errors: HandoffFieldErrors;
  failed: boolean;
}

const controlCharacters = /\p{Cc}/u;
const phonePattern = /^\+?[0-9 ().-]{6,30}$/;
const minPhoneDigits = 6;

function blankToUndefined(value: string): string | undefined {
  return value === "" ? undefined : value;
}

export const handoffInputSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .max(200, "name_invalid")
      .refine((value) => !controlCharacters.test(value), "name_invalid")
      .transform(blankToUndefined)
      .optional(),
    email: z
      .string()
      .trim()
      .transform(blankToUndefined)
      .pipe(z.email("email_invalid").max(320, "email_invalid").optional())
      .optional(),
    phone: z
      .string()
      .trim()
      .transform(blankToUndefined)
      .pipe(
        z
          .string()
          .regex(phonePattern, "phone_invalid")
          .refine((value) => value.replaceAll(/\D/g, "").length >= minPhoneDigits, "phone_invalid")
          .optional(),
      )
      .optional(),
    consent: z.literal(true, { error: "consent_required" }),
  })
  .refine((value) => value.email !== undefined || value.phone !== undefined, {
    path: ["email"],
    error: "contact_required",
    when: () => true,
  });

export type HandoffInput = z.infer<typeof handoffInputSchema>;

export function collectHandoffErrors(error: z.ZodError): HandoffFieldErrors {
  const errors: HandoffFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    if (!handoffFieldNames.includes(field as HandoffFieldName)) continue;
    errors[field as HandoffFieldName] ??= issue.message;
  }
  return errors;
}

export interface ChatController {
  messages: readonly ChatMessage[];
  status: ChatStatus;
  handoff: HandoffState;
  sending: boolean;
  sendError: ChatSendError | null;
  send: (body: string) => Promise<boolean>;
  submitHandoff: (input: HandoffInput) => Promise<void>;
  dismissSendError: () => void;
}

export interface ChatNoticeAction {
  label: string;
  href: string;
}

export interface ChatLabels {
  title: string;
  close: string;
  fullscreen: string;
  fullscreenHref: string;
  nexoName: string;
  subtitleOnline: string;
  subtitleOffline: string;
  subtitleTakeover: string;
  greeting: string;
  logLabel: string;
  you: string;
  jose: string;
  sourcesLabel: string;
  sending: string;
  failed: string;
  typing: string;
  composerLabel: string;
  composerPlaceholder: string;
  send: string;
  sendingMessage: string;
  remaining: string;
  startersLabel: string;
  starters: Record<ChatStarterTopic, string[]>;
  systemEvents: Record<ChatSystemEvent, string>;
  notices: Record<ChatNoticeVariant, { title: string; text: string }>;
  quotaAction: ChatNoticeAction;
  sendErrors: Record<ChatSendError, string>;
  handoff: {
    title: string;
    lead: string;
    nameLabel: string;
    emailLabel: string;
    phoneLabel: string;
    contactHint: string;
    optional: string;
    consentBefore: string;
    consentLink: string;
    consentAfter: string;
    privacyHref: string;
    newTab: string;
    submit: string;
    submitting: string;
    doneTitle: string;
    doneText: string;
    failed: string;
    errors: Record<string, string>;
  };
  avatar: {
    offline: string;
    states: Record<
      "idle" | "greeting" | "listening" | "thinking" | "talking" | "happy" | "sad",
      string
    >;
  };
}
