import { z } from 'zod';

import { chatCaseSchema } from './crm.ts';

// Case-based chat (DATOS v1.2 §4.6, plan 1.8b). The value lists mirror the SQL enums of
// supabase/migrations/20261028100800_chat.sql one to one (test/chat.test.ts reads the migrations and fails on any
// drift). `chat_case` lives in crm.ts because crm_contacts.chat_case needed it first.

export const CONTEXT_STATUSES = ['draft', 'published', 'archived'] as const;
export const THREAD_STATUSES = ['open', 'handed_over', 'closed'] as const;
export const CHAT_SENDERS = ['visitor', 'assistant', 'jose'] as const;
export const CHAT_MESSAGE_TYPES = ['text', 'quick_contact', 'case_switch', 'system'] as const;

export const contextStatusSchema = z.enum(CONTEXT_STATUSES);
export const threadStatusSchema = z.enum(THREAD_STATUSES);
export const chatSenderSchema = z.enum(CHAT_SENDERS);
export const chatMessageTypeSchema = z.enum(CHAT_MESSAGE_TYPES);

const fact = z.string().trim().min(1).max(500);
/** A link the assistant may cite: an https URL or a path of the site. Spec §0.4: no external URL that is not listed. */
const factLink = z.union([z.url({ protocol: /^https$/ }), z.string().regex(/^\/[\w\-./#?=&]*$/)]);

/**
 * `chat_contexts.facts` (D40): the only facts the assistant may state for a case and locale, next to `body_md`.
 * Prices are never facts: `rates_ref: 'pricing'` points the gateway to `pricing.json`. Every key is optional because
 * the column defaults to `{}`; unknown keys are refused so a typo in the CRM editor cannot pass silently.
 */
export const chatContextFactsSchema = z
  .object({
    availability: fact.optional(),
    rates_ref: z.literal('pricing').optional(),
    stack: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
    links: z.record(z.string().regex(/^[a-z][a-z0-9_]*$/), factLink).default({}),
    dos: z.array(fact).max(50).default([]),
    donts: z.array(fact).max(50).default([]),
  })
  .strict();

/** Result of `chat_context_published(p_case, p_locale)` when a context is published (the RPC returns null otherwise). */
export const chatContextPublishedSchema = z.object({
  version: z.number().int().positive(),
  title: z.string().nullable(),
  body_md: z.string(),
  facts: chatContextFactsSchema,
});

/** Payload of the `chat.visitor_message` outbox event (ids only: the gateway reads the message by id). */
export const chatVisitorMessageEventSchema = z.object({
  id: z.uuid(),
  thread_id: z.uuid(),
  case: chatCaseSchema,
  locale: z.enum(['es', 'en']),
  message_type: chatMessageTypeSchema,
  user_id: z.uuid().nullable(),
  contact_id: z.uuid().nullable(),
});
