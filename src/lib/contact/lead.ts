import type { ContactSubmission } from "@/types/contact-form";
import type { Database } from "@/types/database";

import { parseSelection } from "./selection";
import { viaByWay } from "./ways";

export type SubmitLeadArgs = Database["public"]["Functions"]["submit_lead"]["Args"];

export interface LeadRpcError {
  code?: string | null;
  message?: string | null;
  hint?: string | null;
}

export type LeadFailure = "quota" | "consent" | "error";

const quotaMessages = new Set([
  "form_quota_exceeded",
  "form_email_quota_exceeded",
  "form_global_quota_exceeded",
]);

export function mapLeadError(error: LeadRpcError): LeadFailure {
  if (error.hint === "contact_alternatives") return "quota";
  const message = error.message ?? "";
  if (quotaMessages.has(message)) return "quota";
  if (message === "consent_required") return "consent";
  return "error";
}

export function buildLeadArgs(input: ContactSubmission, ipHash: string): SubmitLeadArgs {
  const company = input.company?.trim();
  const selection =
    input.way === "project" ? parseSelection({ offer: input.offer, extras: input.extras }) : null;
  const answers = input.way === "contratacion" ? undefined : input.answers;
  return {
    p_source: "form",
    p_via: viaByWay[input.way],
    p_full_name: input.name,
    p_email: input.email,
    p_organization: company === "" ? undefined : company,
    p_message: input.message,
    p_page_path: `/${input.locale}/contacto`,
    p_locale: input.locale,
    p_consent: input.consent,
    p_ip_hash: ipHash,
    p_offer: selection && selection.offers.length > 0 ? selection.offers.join(",") : undefined,
    p_extras: selection && selection.extras.length > 0 ? selection.extras : undefined,
    p_offer_answers: answers,
  };
}
