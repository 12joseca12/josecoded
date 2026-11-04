import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { ContactSubmitResult } from "@/types/contact-form";
import type { Database } from "@/types/database";

import { readContactServerConfig } from "./env";
import { hashIp } from "./ip";
import { type ContactDeps, processContact } from "./process";
import { findContactLimiter, passesRateLimit } from "./rate-limit";
import { verifyTurnstile } from "./turnstile";

const rpcTimeoutMs = 8000;

function buildDeps(env: Record<string, string | undefined>): ContactDeps | null {
  const config = readContactServerConfig(env);
  if (!config) return null;
  const client = createClient<Database>(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return {
    verifyTurnstile: (token, ip) =>
      verifyTurnstile({
        url: config.turnstileVerifyUrl,
        secret: config.turnstileSecret,
        token,
        ip,
        allowedHostnames: config.allowedHostnames,
      }),
    hashIp: (ip) => hashIp(ip, config.ipHashSecret),
    submitLead: async (args) => {
      try {
        const { error } = await client
          .rpc("submit_lead", args)
          .abortSignal(AbortSignal.timeout(rpcTimeoutMs));
        if (!error) return { ok: true };
        return {
          ok: false,
          error:
            error.code === ""
              ? null
              : { code: error.code, message: error.message, hint: error.hint },
        };
      } catch {
        return { ok: false, error: null };
      }
    },
    rateLimit: async (key) => passesRateLimit(await findContactLimiter(), key),
    reportFailure: (code) => {
      console.error("contact_submit_failed", code);
    },
  };
}

export function handleContact(
  raw: unknown,
  context: { env: Record<string, string | undefined>; ip: string | null },
): Promise<ContactSubmitResult> {
  return processContact(raw, { ip: context.ip, deps: buildDeps(context.env) });
}
