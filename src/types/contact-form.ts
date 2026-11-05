import "@/lib/security/zod-jitless";

import { z } from "zod";

import { locales } from "@/i18n/config";
import {
  accountsValues,
  kindValues,
  managementValues,
  moreValues,
  sizeValues,
} from "@/lib/services/recommender";

import { type WayId, wayIds } from "./services";

export const contactFieldNames = ["way", "name", "email", "company", "message", "consent"] as const;
export type ContactFieldName = (typeof contactFieldNames)[number];

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const controlCharacters = /\p{Cc}/u;

export const offerAnswersSchema = z.union([
  z.strictObject({ start: z.literal("existing") }),
  z.strictObject({
    start: z.enum(["idea", "defined"]),
    kind: z.enum(kindValues),
    size: z.enum(sizeValues),
    accounts: z.enum(accountsValues),
    management: z.enum(managementValues),
    more: z.array(z.enum(moreValues)).max(8),
  }),
]);

export type OfferAnswers = z.infer<typeof offerAnswersSchema>;

export const contactFormSchema = z.strictObject({
  way: z.enum(wayIds, { error: "way_required" }),
  name: z
    .string()
    .trim()
    .min(1, "name_required")
    .max(200, "name_too_long")
    .refine((value) => !controlCharacters.test(value), "name_invalid"),
  email: z
    .string()
    .trim()
    .min(1, "email_required")
    .max(320, "email_invalid")
    .pipe(z.email("email_invalid")),
  company: z
    .string()
    .trim()
    .max(200, "company_too_long")
    .refine((value) => !controlCharacters.test(value), "company_invalid")
    .optional(),
  message: z.string().trim().min(1, "message_required").max(4000, "message_too_long"),
  consent: z.literal(true, { error: "consent_required" }),
  offer: z.array(z.string().max(80).regex(slugPattern)).max(2).optional(),
  extras: z.array(z.string().max(40).regex(slugPattern)).max(12).optional(),
  answers: offerAnswersSchema.optional(),
  homepage: z.string().max(500).optional(),
});

export const contactSubmissionSchema = contactFormSchema.extend({
  locale: z.enum(locales),
  turnstileToken: z.string().min(1, "verification_required").max(2048, "verification_required"),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

export type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;

export type ContactSubmitResult =
  | { status: "sent" }
  | { status: "invalid"; errors: ContactFieldErrors }
  | { status: "verification_failed" }
  | { status: "quota" }
  | { status: "unavailable" }
  | { status: "error" };

export function collectFieldErrors(error: z.ZodError): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    if (!(contactFieldNames as readonly string[]).includes(field)) continue;
    const name = field as ContactFieldName;
    errors[name] ??= issue.message;
  }
  return errors;
}

export interface ContactSelectionLabels {
  title: string;
  from: string;
  provisional: string;
  perMonth: string;
  change: string;
  warranty: string;
  proposal: string;
}

export type ContactCopyKey = WayId | "any";

export interface ContactFormLabels {
  wayLegend: string;
  ways: Record<(typeof wayIds)[number], { label: string; hint: string }>;
  nameLabel: string;
  emailLabel: string;
  companyLabel: string;
  optional: string;
  messageLabel: string;
  messageHint: string;
  consentBefore: string;
  consentLink: string;
  consentAfter: string;
  submit: string;
  submitting: string;
  verificationLabel: string;
  verificationLoading: string;
  verificationLoadFailed: string;
  verificationRetry: string;
  selection: ContactSelectionLabels;
  summaryOne: string;
  summaryMany: string;
  errors: Record<string, string>;
  genericError: string;
  next: { title: string; noCommitment: string; steps: Record<ContactCopyKey, string[]> };
  example: { summary: string; byWay: Record<ContactCopyKey, string> };
  sent: {
    title: string;
    nextTitle: string;
    alternative: string;
    again: string;
    byWay: Record<WayId, { text: string; next: string }>;
  };
  quota: { title: string; text: string; alternative: string };
  verificationFailed: { title: string; text: string };
  failed: { title: string; text: string; alternative: string };
  unavailable: { title: string; text: string };
  honeypotLabel: string;
}
