import type {
  CHAT_MESSAGE_TYPES,
  CHAT_SENDERS,
  chatContextFactsSchema,
  chatContextPublishedSchema,
  chatVisitorMessageEventSchema,
  CONTEXT_STATUSES,
  THREAD_STATUSES,
} from './schemas';
import type { z } from 'zod';

// Case-based chat (DATOS v1.2 §4.6). The unions come from the value lists in schemas/chat.ts, which mirror the SQL
// enums (test/chat.test.ts); `ChatCase` is in crm.ts. Rows use Tables<'chat_threads'> etc. from `db.ts` once
// `database.ts` is generated from Supabase local.

export type ContextStatus = (typeof CONTEXT_STATUSES)[number];
export type ThreadStatus = (typeof THREAD_STATUSES)[number];
export type ChatSender = (typeof CHAT_SENDERS)[number];
export type ChatMessageType = (typeof CHAT_MESSAGE_TYPES)[number];

/** Parsed `chat_contexts.facts`; `ChatContextFactsRaw` is what the CRM editor may send before defaults apply. */
export type ChatContextFacts = z.infer<typeof chatContextFactsSchema>;
export type ChatContextFactsRaw = z.input<typeof chatContextFactsSchema>;
/** `chat_context_published()` result; `null` when the case has no published context in that locale. */
export type ChatContextPublished = z.infer<typeof chatContextPublishedSchema>;
export type ChatVisitorMessageEvent = z.infer<typeof chatVisitorMessageEventSchema>;
