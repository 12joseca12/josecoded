// Ports of the public-facing modules (proposals, leads, assistant), working-agreements §17.1. Real adapters live in
// src/adapters/; tests inject fakes through `env.__deps`. Kept in the gateway (not in @josecoded/types) because no
// other package implements or consumes them.
import type { CreateLeadInput } from '@josecoded/types';

export type CreateLeadPayload = CreateLeadInput;

/** `ok`: Cloudflare accepted the token; `failed`: it refused it (invalid, reused, wrong action or hostname); `unavailable`: no verdict. */
export type TurnstileVerdict = 'ok' | 'failed' | 'unavailable';

export interface TurnstileVerifier {
  /** `actions`: the widget actions this route accepts (the token must carry one of them). */
  verify(token: string, ip: string, actions: readonly string[]): Promise<TurnstileVerdict>;
}

/** Atomic counters over `public.increment_quota` (`private.quota_counters`). */
export interface QuotaStore {
  /** Counts one use of `key`; `true` while the count stays within `limit` for the window of `ttlSeconds`. */
  hit(key: string, limit: number, ttlSeconds: number): Promise<boolean>;
}

export interface AiCompletion {
  /** AI Gateway metadata `consumer` (cost and logs are split by it). */
  consumer: 'proposals' | 'assistant';
  /** Overrides the adapter's default model for this consumer. */
  model?: string;
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  /** JSON schema of the answer (JSON mode); the result is then the parsed object. */
  jsonSchema?: Record<string, unknown>;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

/** Workers AI through the AI Gateway. Throws `Error('ai_unavailable')` on any failure, with no upstream detail. */
export interface AiClient {
  complete(request: AiCompletion): Promise<unknown>;
}

/** Result of `create_lead(p)`. */
export interface CreatedLead {
  leadId: string;
  contactId: string;
  /** `false`: the idempotency key already had a lead and this is it. */
  created: boolean;
}

/** `public.create_lead(p jsonb)` (service role): finds or creates the contact, the lead, the interaction and the outbox event. */
export interface LeadsRepo {
  create(p: CreateLeadPayload): Promise<CreatedLead>;
}

/** `affiliates` (service role). */
export interface AffiliatesRepo {
  /** The owner of an affiliate code, or `null` when no affiliate has it. */
  findOwner(code: string): Promise<{ userId: string } | null>;
  /** Email of an Auth user, `null` when unknown. */
  userEmail(userId: string): Promise<string | null>;
}
