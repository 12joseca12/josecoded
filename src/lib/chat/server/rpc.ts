import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { ContactServerConfig } from "@/lib/contact/env";
import type { HandoffInput } from "@/types/chat";
import {
  visitorSendRowsSchema,
  type VisitorThread,
  visitorThreadSchema,
} from "@/types/chat-visitor";

export interface RpcFailure {
  code: string | null;
  message: string;
  hint: string | null;
}

export type RpcResult<T> = { ok: true; data: T } | { ok: false; error: RpcFailure | null };

export interface VisitorSendArgs {
  tokenHash: string;
  body: string;
  pagePath: string | null;
  locale: string;
  ipHash: string;
}

export interface ChatRpc {
  send: (
    args: VisitorSendArgs,
  ) => Promise<RpcResult<{ conversationId: string; messageId: string }>>;
  thread: (tokenHash: string, since: string | null) => Promise<RpcResult<VisitorThread>>;
  handoff: (tokenHash: string, input: HandoffInput) => Promise<RpcResult<string>>;
}

const rpcTimeoutMs = 8000;

interface RawRpcError {
  code: string;
  message: string;
  hint: string | null;
}

function failure(error: RawRpcError): RpcResult<never> {
  if (error.code === "") return { ok: false, error: null };
  return { ok: false, error: { code: error.code, message: error.message, hint: error.hint } };
}

export function createChatRpc(config: ContactServerConfig): ChatRpc {
  const client = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });

  return {
    async send(args) {
      try {
        const result = await client
          .rpc("visitor_send", {
            p_token_hash: args.tokenHash,
            p_body: args.body,
            p_page_path: args.pagePath,
            p_locale: args.locale,
            p_ip_hash: args.ipHash,
          })
          .abortSignal(AbortSignal.timeout(rpcTimeoutMs));
        const data: unknown = result.data;
        if (result.error) return failure(result.error);
        const rows = visitorSendRowsSchema.safeParse(data);
        const row = rows.success ? rows.data[0] : undefined;
        if (!row) return { ok: false, error: null };
        return {
          ok: true,
          data: { conversationId: row.conversation_id, messageId: row.message_id },
        };
      } catch {
        return { ok: false, error: null };
      }
    },
    async thread(tokenHash, since) {
      try {
        const result = await client
          .rpc("visitor_thread", { p_token_hash: tokenHash, ...(since ? { p_since: since } : {}) })
          .abortSignal(AbortSignal.timeout(rpcTimeoutMs));
        const data: unknown = result.data;
        if (result.error) return failure(result.error);
        const parsed = visitorThreadSchema.safeParse(data);
        return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: null };
      } catch {
        return { ok: false, error: null };
      }
    },
    async handoff(tokenHash, input) {
      try {
        const result = await client
          .rpc("visitor_handoff", {
            p_token_hash: tokenHash,
            p_email: input.email ?? "",
            p_phone: input.phone ?? "",
            p_name: input.name ?? "",
            p_consent: input.consent,
          })
          .abortSignal(AbortSignal.timeout(rpcTimeoutMs));
        const data: unknown = result.data;
        if (result.error) return failure(result.error);
        return typeof data === "string" ? { ok: true, data } : { ok: false, error: null };
      } catch {
        return { ok: false, error: null };
      }
    },
  };
}
