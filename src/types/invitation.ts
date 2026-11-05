import "@/lib/security/zod-jitless";

import { z } from "zod";

import { locales } from "@/i18n/config";
import { userRoles } from "@/types/auth";

export const invitationTokenPattern = /^[A-Za-z0-9_-]{1,128}$/;

export const invitationStates = ["pending", "accepted", "expired", "revoked"] as const;
export type InvitationState = (typeof invitationStates)[number];

export const invitationRowSchema = z.object({
  role: z.enum(userRoles),
  invited_by_name: z.string().nullable(),
  email: z.string(),
  expires_at: z.string(),
  status: z.enum(invitationStates),
});

export type InvitationSummary =
  | { status: "unknown" }
  | {
      status: InvitationState;
      role: (typeof userRoles)[number];
      inviterName: string | null;
      email: string;
      expiresAt: string;
    };

export const acceptInputSchema = z.strictObject({
  token: z.string().regex(invitationTokenPattern),
  fullName: z.string().trim().min(1).max(200),
  locale: z.enum(locales),
});

export type AcceptInput = z.infer<typeof acceptInputSchema>;

export type AcceptFailure = "gone" | "expired" | "used" | "mismatch" | "exists" | "error";

export type AcceptResult =
  | { status: "done"; destination: string }
  | { status: "invalid" }
  | { status: "failed"; failure: AcceptFailure };

export type AcceptHandler = (raw: unknown) => Promise<AcceptResult>;

export type InvitationView =
  | { kind: "gone"; reason: "unknown" | "revoked" | "expired" | "used" }
  | { kind: "login" }
  | { kind: "enter"; destination: string }
  | { kind: "mismatch" }
  | { kind: "accept" };

export interface InvitationLabels {
  title: string;
  lead: string;
  leadAnonymous: string;
  roles: Record<(typeof userRoles)[number], string>;
  expires: string;
  enter: string;
  enterHint: string;
  acceptTitle: string;
  nameLabel: string;
  nameHint: string;
  localeLabel: string;
  locales: Record<(typeof locales)[number], string>;
  accept: string;
  accepting: string;
  errors: Record<"name" | AcceptFailure, string>;
  gone: Record<"unknown" | "revoked" | "expired" | "used", { title: string; text: string }>;
  goneAction: string;
  mismatch: { title: string; text: string; action: string; acting: string };
}
