import {
  collectFieldErrors,
  type ContactSubmission,
  contactSubmissionSchema,
  type ContactSubmitResult,
} from "@/types/contact-form";

import { isKnownIp } from "./ip";
import { buildLeadArgs, type LeadRpcError, mapLeadError, type SubmitLeadArgs } from "./lead";
import type { TurnstileOutcome } from "./turnstile";

export type SubmitLeadOutcome = { ok: true } | { ok: false; error: LeadRpcError | null };

export interface ContactDeps {
  verifyTurnstile: (token: string, ip: string | null) => Promise<TurnstileOutcome>;
  hashIp: (ip: string | null) => Promise<string>;
  submitLead: (args: SubmitLeadArgs) => Promise<SubmitLeadOutcome>;
  rateLimit: (key: string) => Promise<boolean>;
  reportFailure: (code: string) => void;
}

interface ProcessContext {
  ip: string | null;
  deps: ContactDeps | null;
}

function honeypotFilled(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null || !("homepage" in raw)) return false;
  const value = raw.homepage;
  return typeof value === "string" && value.trim() !== "";
}

export async function processContact(
  raw: unknown,
  { ip, deps }: ProcessContext,
): Promise<ContactSubmitResult> {
  if (honeypotFilled(raw)) return { status: "sent" };
  if (!deps) return { status: "unavailable" };

  const parsed = contactSubmissionSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", errors: collectFieldErrors(parsed.error) };
  const input: ContactSubmission = parsed.data;

  const clientIp = isKnownIp(ip) ? ip : null;
  if (clientIp === null) deps.reportFailure("ip_missing");
  const ipHash = await deps.hashIp(ip);
  if (!(await deps.rateLimit(ipHash))) return { status: "quota" };

  const verification = await deps.verifyTurnstile(input.turnstileToken, clientIp);
  if (verification === "rejected") return { status: "verification_failed" };
  if (verification === "unreachable") {
    deps.reportFailure("turnstile_unreachable");
    return { status: "error" };
  }

  const outcome = await deps.submitLead(buildLeadArgs(input, ipHash));
  if (outcome.ok) return { status: "sent" };
  if (!outcome.error) {
    deps.reportFailure("lead_unreachable");
    return { status: "error" };
  }

  const failure = mapLeadError(outcome.error);
  if (failure === "quota") return { status: "quota" };
  if (failure === "consent") return { status: "invalid", errors: { consent: "consent_required" } };
  deps.reportFailure(outcome.error.code ?? "lead_error");
  return { status: "error" };
}
