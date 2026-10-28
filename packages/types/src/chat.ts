import type { Enums } from './db.ts';
import type {
  chatContextFactsSchema,
  chatContextPublishedSchema,
  chatVisitorMessageEventSchema,
} from './schemas';
import type { z } from 'zod';

// Case-based chat (DATOS v1.2 §4.6). Enum unions are `Enums<>` of the generated `database.ts`; the zod lists in
// schemas/chat.ts validate at the boundaries and test/enums.test-d.ts breaks typecheck on drift. `ChatCase` is in crm.ts.

export type ContextStatus = Enums<'context_status'>;
export type ThreadStatus = Enums<'thread_status'>;
export type ChatSender = Enums<'chat_sender'>;
export type ChatMessageType = Enums<'chat_message_type'>;

/** Parsed `chat_contexts.facts`; `ChatContextFactsRaw` is what the CRM editor may send before defaults apply. */
export type ChatContextFacts = z.infer<typeof chatContextFactsSchema>;
export type ChatContextFactsRaw = z.input<typeof chatContextFactsSchema>;
/** `chat_context_published()` result; `null` when the case has no published context in that locale. */
export type ChatContextPublished = z.infer<typeof chatContextPublishedSchema>;
export type ChatVisitorMessageEvent = z.infer<typeof chatVisitorMessageEventSchema>;
