import {
  type ContactClientConfig,
  type Env,
  isLoopbackMode,
  readContactClientConfig,
} from "@/lib/contact/env";

export interface ChatClientConfig {
  turnstile: ContactClientConfig | null;
  pollMs: number;
}

const defaultClientPollMs = 10_000;

export function readChatClientConfig(env: Env): ChatClientConfig {
  const override = Number(env.E2E_CHAT_POLL_MS);
  return {
    turnstile: readContactClientConfig(env),
    pollMs: isLoopbackMode(env) && override > 0 ? override : defaultClientPollMs,
  };
}
