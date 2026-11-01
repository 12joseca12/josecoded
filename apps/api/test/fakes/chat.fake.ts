import type { ChatContextsRepo, ChatMessageRow, ChatRepo, ChatThreadRow } from '../../src/ports';
import type { ChatContextPublished } from '@josecoded/types';

export interface FakeChat extends ChatRepo {
  threads: ChatThreadRow[];
  messages: ChatMessageRow[];
  /** `[contactId, threadId]` pairs written by `linkInteraction`. */
  interactions: [string, string][];
}

/** In-memory ChatRepo: ordered by an internal counter so `created_at` always increases. */
export function createFakeChat(): FakeChat {
  let tick = 0;
  const stamp = () => new Date(Date.UTC(2026, 10, 1, 10, 0, 0) + ++tick * 1000).toISOString();
  const fake: FakeChat = {
    threads: [],
    messages: [],
    interactions: [],
    async createThread(input) {
      const row: ChatThreadRow = {
        id: crypto.randomUUID(),
        visitor_id: input.visitorId,
        user_id: null,
        contact_id: null,
        case: input.case,
        locale: input.locale,
        origin_path: input.originPath,
        ai_enabled: true,
        status: 'open',
        last_message_at: null,
        unread_for_admin: false,
        ip_hash: input.ipHash,
        context_version: input.contextVersion,
        created_at: stamp(),
        updated_at: stamp(),
      };
      fake.threads.push(row);
      return structuredClone(row);
    },
    async getThread(id) {
      const row = fake.threads.find((t) => t.id === id);
      return row ? structuredClone(row) : null;
    },
    async findCurrent({ visitorId, userId }) {
      const rows = fake.threads
        .filter((t) => t.status !== 'closed' && ((visitorId && t.visitor_id === visitorId) || (userId && t.user_id === userId)))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return rows[0] ? structuredClone(rows[0]) : null;
    },
    async updateThread(id, patch) {
      const row = fake.threads.find((t) => t.id === id);
      if (row) Object.assign(row, patch);
    },
    async addMessage(input) {
      const row: ChatMessageRow = {
        id: crypto.randomUUID(),
        thread_id: input.thread_id,
        sender_role: input.sender_role,
        content: input.content,
        message_type: input.message_type ?? 'text',
        metadata: input.metadata ?? {},
        created_at: stamp(),
      };
      fake.messages.push(row);
      // what private.chat_message_after_insert does
      const thread = fake.threads.find((t) => t.id === input.thread_id);
      if (thread) {
        thread.last_message_at = row.created_at;
        if (row.sender_role === 'visitor') thread.unread_for_admin = true;
      }
      return structuredClone(row);
    },
    async listMessages(threadId, { after, limit }) {
      return fake.messages
        .filter((m) => m.thread_id === threadId && (!after || m.created_at > after))
        .slice(0, limit)
        .map((m) => structuredClone(m));
    },
    async recentMessages(threadId, limit) {
      return fake.messages
        .filter((m) => m.thread_id === threadId)
        .slice(-limit)
        .map((m) => structuredClone(m));
    },
    async listThreads({ unreadOnly, limit }) {
      return fake.threads
        .filter((t) => !unreadOnly || t.unread_for_admin)
        .slice(0, limit)
        .map((t) => structuredClone(t));
    },
    async linkInteraction(contactId, threadId) {
      fake.interactions.push([contactId, threadId]);
    },
  };
  return fake;
}

export interface FakeContexts extends ChatContextsRepo {
  calls: string[];
  contexts: Record<string, ChatContextPublished>;
}

/** Published contexts keyed `case:locale`. */
export function createFakeContexts(contexts: Record<string, Partial<ChatContextPublished> & { body_md: string }> = {}): FakeContexts {
  const fake: FakeContexts = {
    calls: [],
    contexts: Object.fromEntries(
      Object.entries(contexts).map(([key, value]) => [
        key,
        { version: 1, title: null, facts: { stack: [], links: {}, dos: [], donts: [] }, ...value } as ChatContextPublished,
      ]),
    ),
    async published(chatCase, locale) {
      fake.calls.push(`${chatCase}:${locale}`);
      return fake.contexts[`${chatCase}:${locale}`] ?? null;
    },
  };
  return fake;
}
