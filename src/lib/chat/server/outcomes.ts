import type { HandoffFieldErrors } from "@/types/chat";

import type { RpcFailure } from "./rpc";

export type SendFailure = "invalid" | "burst" | "quota" | "closed" | "off" | "unavailable";

const invalidMessages = new Set([
  "invalid_token",
  "invalid_ip_hash",
  "empty_body",
  "body_too_long",
]);

export function mapSendFailure(error: RpcFailure | null): SendFailure {
  if (error === null) return "unavailable";
  if (error.message === "chat_quota_exceeded") return error.hint === "burst" ? "burst" : "quota";
  if (error.message === "chat_closed") return "closed";
  if (error.message === "public_chat_off") return "off";
  if (invalidMessages.has(error.message)) return "invalid";
  return "unavailable";
}

export type HandoffFailure =
  { kind: "invalid"; errors: HandoffFieldErrors } | { kind: "closed" } | { kind: "unavailable" };

const handoffFieldErrors: Record<string, HandoffFieldErrors> = {
  consent_required: { consent: "consent_required" },
  contact_required: { email: "contact_required" },
  invalid_email: { email: "email_invalid" },
  invalid_phone: { phone: "phone_invalid" },
  invalid_name: { name: "name_invalid" },
};

export function mapHandoffFailure(error: RpcFailure | null): HandoffFailure {
  if (error === null) return { kind: "unavailable" };
  const errors = handoffFieldErrors[error.message];
  if (errors) return { kind: "invalid", errors };
  if (error.message === "chat_not_found" || error.message === "invalid_token") {
    return { kind: "closed" };
  }
  return { kind: "unavailable" };
}
