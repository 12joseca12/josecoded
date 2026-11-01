// Real adapters of ChatRepo and ChatContextsRepo (service role). The anonymous visitor has no grant on chat_* (DATOS
// §4.6): every access goes through the gateway, which has already checked the signed `chat_sid` or the user's JWT.
import { chatContextPublishedSchema } from '@josecoded/types';

import { callRpc, type RpcClient } from './scheduled-jobs';

import type { ChatContextsRepo, ChatRepo } from '../ports';
import type { Database } from '@josecoded/types';
import type { SupabaseClient } from '@supabase/supabase-js';

const THREAD_COLUMNS =
  'id, visitor_id, user_id, contact_id, case, locale, origin_path, ai_enabled, status, last_message_at, unread_for_admin, ip_hash, context_version, created_at, updated_at';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MESSAGE_COLUMNS = 'id, thread_id, sender_role, content, message_type, metadata, created_at';

function check<T>(label: string, result: { data: T | null; error: { message: string } | null }): T | null {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

export function createChatRepo(admin: () => SupabaseClient<Database>): ChatRepo {
  return {
    async createThread(input) {
      const row = check(
        'chat_threads insert',
        await admin()
          .from('chat_threads')
          .insert({
            visitor_id: input.visitorId,
            case: input.case,
            locale: input.locale,
            origin_path: input.originPath,
            ip_hash: input.ipHash,
            context_version: input.contextVersion,
          })
          .select(THREAD_COLUMNS)
          .single(),
      );
      if (!row) throw new Error('chat_threads insert: no row');
      return row;
    },
    async getThread(id) {
      return check('chat_threads select', await admin().from('chat_threads').select(THREAD_COLUMNS).eq('id', id).maybeSingle());
    },
    async findCurrent({ visitorId, userId }) {
      // PostgREST `or` over two uuids that already passed validation (the cookie's signature, Auth's user id)
      // the values go into a PostgREST filter string: only well-formed uuids are ever interpolated
      const filters = [
        visitorId && UUID.test(visitorId) && `visitor_id.eq.${visitorId}`,
        userId && UUID.test(userId) && `user_id.eq.${userId}`,
      ].filter(Boolean);
      if (filters.length === 0) return null;
      const rows = check(
        'chat_threads current',
        await admin()
          .from('chat_threads')
          .select(THREAD_COLUMNS)
          .or(filters.join(','))
          .neq('status', 'closed')
          .order('created_at', { ascending: false })
          .limit(1),
      );
      return rows?.[0] ?? null;
    },
    async updateThread(id, patch) {
      check('chat_threads update', await admin().from('chat_threads').update(patch).eq('id', id).select('id').maybeSingle());
    },
    async addMessage(input) {
      const row = check('chat_messages insert', await admin().from('chat_messages').insert(input).select(MESSAGE_COLUMNS).single());
      if (!row) throw new Error('chat_messages insert: no row');
      return row;
    },
    async listMessages(threadId, { after, limit }) {
      let query = admin().from('chat_messages').select(MESSAGE_COLUMNS).eq('thread_id', threadId);
      if (after) query = query.gt('created_at', after);
      return check('chat_messages list', await query.order('created_at', { ascending: true }).limit(limit)) ?? [];
    },
    async recentMessages(threadId, limit) {
      const rows =
        check(
          'chat_messages recent',
          await admin().from('chat_messages').select(MESSAGE_COLUMNS).eq('thread_id', threadId).order('created_at', { ascending: false }).limit(limit),
        ) ?? [];
      return rows.reverse();
    },
    async listThreads({ unreadOnly, limit }) {
      let query = admin().from('chat_threads').select(THREAD_COLUMNS);
      if (unreadOnly) query = query.eq('unread_for_admin', true);
      return check('chat_threads list', await query.order('last_message_at', { ascending: false, nullsFirst: false }).limit(limit)) ?? [];
    },
    async linkInteraction(contactId, threadId) {
      check(
        'crm_interactions insert',
        await admin()
          .from('crm_interactions')
          .insert({ contact_id: contactId, kind: 'chat_thread', channel: 'chat', direction: 'in', actor: 'contact', chat_thread_id: threadId })
          .select('id')
          .maybeSingle(),
      );
    },
  };
}

export function createChatContextsRepo(client: RpcClient): ChatContextsRepo {
  return {
    async published(chatCase, locale) {
      const data = await callRpc(client, 'chat_context_published', { p_case: chatCase, p_locale: locale });
      if (data === null || data === undefined) return null;
      // a context whose facts do not fit the schema (a typo saved from the CRM) is as good as none
      const parsed = chatContextPublishedSchema.safeParse(data);
      return parsed.success ? parsed.data : null;
    },
  };
}
