import "server-only";

import { type Env, readContactServerConfig } from "@/lib/contact/env";
import { hashIp } from "@/lib/contact/ip";
import { findChatLimiter, passesChatRateLimit } from "@/lib/contact/rate-limit";
import { verifyTurnstile } from "@/lib/contact/turnstile";
import { getFeatures } from "@/lib/settings/features";

import type { ChatDeps } from "./process";
import { createChatRpc } from "./rpc";

export const chatTurnstileAction = "chat";
const defaultPollMs = 2000;
const maxStreamMs = 10 * 60 * 1000;
const pingEveryMs = 15_000;

export interface ChatRuntime {
  deps: ChatDeps;
  pollMs: number;
  maxStreamMs: number;
  pingEveryMs: number;
}

export function buildChatRuntime(env: Env): ChatRuntime | null {
  const config = readContactServerConfig(env);
  if (!config) return null;
  const override = Number(env.E2E_CHAT_POLL_MS);
  const pollMs = config.loopback && override > 0 ? override : defaultPollMs;
  return {
    pollMs,
    maxStreamMs,
    pingEveryMs,
    deps: {
      cookieSecret: config.ipHashSecret,
      isOn: async () => (await getFeatures()).chat,
      hashIp: (ip) => hashIp(ip, config.ipHashSecret),
      rateLimit: async (key) => passesChatRateLimit(await findChatLimiter(), key, config.loopback),
      verifyTurnstile: (token, ip) =>
        verifyTurnstile({
          url: config.turnstileVerifyUrl,
          secret: config.turnstileSecret,
          token,
          ip,
          allowedHostnames: config.allowedHostnames,
          action: chatTurnstileAction,
        }),
      rpc: createChatRpc(config),
      reportFailure: (code) => {
        console.error("chat_visitor_failed", code);
      },
    },
  };
}
