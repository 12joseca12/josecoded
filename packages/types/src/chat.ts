import type { ChatCase } from './crm.ts';
import type { Enums } from './db.ts';
import type { Href } from './i18n.ts';
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

// --- View models of `/chat` (block B02): what the screen is painted from, whatever the source (fixtures now, the gateway in B03).

/** One entry of the thread. Text is plain text: the screen never renders HTML or Markdown from a message. */
export type ChatThreadItem =
  | { id: string; kind: 'message'; from: ChatSender; text: string }
  | { id: string; kind: 'quick_contact' }
  | { id: string; kind: 'case_switch'; to: ChatCase };

export type ChatViewData = {
  case: ChatCase;
  thread: readonly ChatThreadItem[];
  /** Messages the visitor has sent today and the daily limit (21st message is refused). */
  quota: { used: number; limit: number };
  /** Jose took the thread over: the assistant is off. */
  handover: boolean;
  /** A logged-in visitor already has the thread saved to the account. */
  signedIn: boolean;
};

export type ChatCaseSelectorVariant = 'full' | 'compact';

/** Ways to reach Jose offered inside the chat (`QuickContact`); a way without data is not drawn. */
export type ChatContact = { whatsapp?: Href; book?: Href; email?: string; linkedin?: Href };

/** Why a call to the assistant routes failed, in the words the screen cares about (B03); the client maps the gateway's status and code. */
export type ChatFailure = 'captcha' | 'rate' | 'quota' | 'closed' | 'forbidden' | 'missing' | 'invalid' | 'down';

export type ChatResult<T> = { status: 'ok'; data: T } | { status: 'error'; reason: ChatFailure };
