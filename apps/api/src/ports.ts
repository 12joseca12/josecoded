// Ports of the public-facing modules (proposals, leads, assistant), working-agreements §17.1. Real adapters live in
// src/adapters/; tests inject fakes through `env.__deps`. Kept in the gateway (not in @josecoded/types) because no
// other package implements or consumes them.
import type { ChatCase, ChatContextPublished, CreateLeadInput, Database } from '@josecoded/types';

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

export type ChatThreadRow = Database['public']['Tables']['chat_threads']['Row'];
export type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row'];
export type ChatThreadPatch = Database['public']['Tables']['chat_threads']['Update'];
export type ChatMessageInput = Pick<Database['public']['Tables']['chat_messages']['Insert'], 'thread_id' | 'sender_role' | 'content' | 'message_type' | 'metadata'>;

/** `chat_threads`, `chat_messages` and the CRM link (service role: the anonymous visitor has no grants, DATOS §4.6). */
export interface ChatRepo {
  createThread(input: {
    visitorId: string;
    case: ChatCase;
    locale: 'es' | 'en';
    originPath: string;
    ipHash: string;
    contextVersion: number | null;
  }): Promise<ChatThreadRow>;
  getThread(id: string): Promise<ChatThreadRow | null>;
  /** The most recent thread of a visitor id or of a user (either may be absent), or `null`. */
  findCurrent(by: { visitorId?: string; userId?: string }): Promise<ChatThreadRow | null>;
  updateThread(id: string, patch: ChatThreadPatch): Promise<void>;
  addMessage(input: ChatMessageInput): Promise<ChatMessageRow>;
  /** Oldest first. `after` is an ISO timestamp: only newer messages. */
  listMessages(threadId: string, options: { after?: string; limit: number }): Promise<ChatMessageRow[]>;
  /** The last `limit` messages, oldest first. */
  recentMessages(threadId: string, limit: number): Promise<ChatMessageRow[]>;
  listThreads(options: { unreadOnly: boolean; limit: number }): Promise<ChatThreadRow[]>;
  /** `crm_interactions(kind = 'chat_thread')` of a contact. */
  linkInteraction(contactId: string, threadId: string): Promise<void>;
}

/** `chat_context_published(case, locale)`: the single published context, or `null`. */
export interface ChatContextsRepo {
  published(chatCase: ChatCase, locale: 'es' | 'en'): Promise<ChatContextPublished | null>;
}

/** One way to reach somebody about an outbox event (`notification_recipients`). `address` is `null` for the client of the event. */
export interface Recipient {
  channel: 'telegram' | 'email';
  address: string | null;
  /** Set by the gateway, never by the database: Jose's own chat (`TELEGRAM_ADMIN_CHAT_ID`), for `system.*` and as the safety net. */
  adminChat?: true;
}

/** `public.notification_recipients(event, owner)` (service role): who is told about an event, from the admin's rules. */
export interface RecipientsRepo {
  forEvent(event: string, ownerId: string | null): Promise<Recipient[]>;
}

/** `staff_telegram_link(code, chat_id)` (service role): binds the Telegram chat of whoever holds a live code and burns it. */
export interface StaffTelegramLinks {
  link(code: string, chatId: string): Promise<boolean>;
}

/** Where to write to the client of a `story.decided` / `client.invited` event, read with the service role. */
export interface ClientContacts {
  /** The email and language of a client: the account's email once he signed in, the invited one before. `null` when unknown. */
  contactOf(clientId: string): Promise<{ email: string; locale: 'es' | 'en' } | null>;
}

/** Content publications (`site_content_publications`, service role) and the RPC that notes their progress (task 3.8c). */
export interface ContentPublication {
  id: string;
  status: 'queued' | 'committed' | 'deployed' | 'failed';
  /** `{files: {path: content}}` as `content_publish()` built it. */
  snapshot: unknown;
  commitSha: string | null;
  committedAt: Date | null;
}

export interface ContentPublicationsRepo {
  get(id: string): Promise<ContentPublication | null>;
  /** Publications in `committed`, oldest first. */
  listCommitted(limit: number): Promise<ContentPublication[]>;
  mark(update: {
    id: string;
    status: 'committed' | 'deployed' | 'failed';
    commitSha?: string;
    files?: Record<string, string>;
    runId?: number;
    error?: string;
  }): Promise<void>;
}

/** A line of the tree of a commit: a file with its full content, or the removal of a path (`sha: null`). */
export type TreeEntry =
  | { path: string; mode: '100644'; type: 'blob'; content: string }
  | { path: string; mode: '100644'; type: 'blob'; sha: null };

export interface RepoCallHooks {
  /** Called before every HTTP request the adapter makes, so the caller can count it against its subrequest budget. */
  onRequest?: () => void;
}

export interface RepoCommitResult {
  /** The new commit, or the current head when the tree did not change (`changed: false`). */
  commitSha: string;
  /** `{path: blob sha}` of the files the commit wrote. */
  files: Record<string, string>;
  changed: boolean;
}

export interface WorkflowRunSummary {
  id: number;
  status: string;
  conclusion: string | null;
}

/** The GitHub App `josecoded-bot` (task 3.8c): one commit on the main branch through the Git Data API, and the deploy run to watch. */
export interface RepoWriter {
  /** Paths of the files directly under `dir` on the branch; `[]` when the directory does not exist. */
  listDirectory(dir: string, hooks?: RepoCallHooks): Promise<string[]>;
  /** One commit with all `entries`, fast-forward only (one retry if the branch moved). */
  commit(input: { message: string; entries: TreeEntry[] }, hooks?: RepoCallHooks): Promise<RepoCommitResult>;
  /** The run of the deploy workflow whose head is `sha`, or `null` if there is none (yet). */
  workflowRunForSha(sha: string, hooks?: RepoCallHooks): Promise<WorkflowRunSummary | null>;
}
