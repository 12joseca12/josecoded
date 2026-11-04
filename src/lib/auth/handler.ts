import "server-only";

import { features } from "@/config/features";
import { site } from "@/config/site";
import { requiresAal2 } from "@/lib/auth/roles";
import { passesRateLimit } from "@/lib/contact/rate-limit";
import { verifyTurnstile } from "@/lib/contact/turnstile";
import { createSupabaseServerClient, type ServerSupabase } from "@/lib/supabase/server";
import {
  type EnrollmentResult,
  type GoogleStartResult,
  googleStartSchema,
  type RequestCodeResult,
  type VerifyCodeResult,
  type VerifyTotpResult,
} from "@/types/auth";

import { type AuthServerConfig, readAuthServerConfig } from "./env";
import { resolveDestination } from "./guards";
import { type AuthOutcome, classifyCodeError, classifySendError } from "./outcome";
import {
  type EnrollStart,
  mapEnrollment,
  processRequestCode,
  processVerifyCode,
  processVerifyTotp,
  type RequestCodeDeps,
  type TotpDeps,
  type VerifyCodeDeps,
} from "./process";
import { findAuthLimiter } from "./rate-limit";
import { readSessionState } from "./session";

export const turnstileLoginAction = "login";

const factorName = "josecoded";

interface Context {
  config: AuthServerConfig;
  client: ServerSupabase;
}

async function createContext(env: Record<string, string | undefined>): Promise<Context | null> {
  const config = readAuthServerConfig(env);
  if (!config) return null;
  const client = await createSupabaseServerClient(env);
  if (!client) return null;
  return { config, client };
}

async function attempt(run: () => Promise<AuthOutcome>): Promise<AuthOutcome> {
  try {
    return await run();
  } catch {
    return { ok: false, failure: "error" };
  }
}

async function destinationFor(client: ServerSupabase, locale: string, next: string | undefined) {
  return resolveDestination(await readSessionState(client), locale, next);
}

export async function handleRequestCode(
  raw: unknown,
  ip: string | null,
  env: Record<string, string | undefined>,
): Promise<RequestCodeResult> {
  const context = await createContext(env);
  const deps: RequestCodeDeps | null = context
    ? {
        verifyTurnstile: (token, clientIp) =>
          verifyTurnstile({
            url: context.config.turnstileVerifyUrl,
            secret: context.config.turnstileSecret,
            token,
            ip: clientIp,
            allowedHostnames: context.config.allowedHostnames,
            action: turnstileLoginAction,
          }),
        rateLimit: async (key) => passesRateLimit(await findAuthLimiter(), key),
        sendCode: (email) =>
          attempt(async () => {
            const { error } = await context.client.auth.signInWithOtp({
              email,
              options: { shouldCreateUser: false },
            });
            return error ? { ok: false, failure: classifySendError(error) } : { ok: true };
          }),
        reportFailure: (code) => {
          console.error("auth_request_code_failed", code);
        },
      }
    : null;
  return processRequestCode(raw, { ip, deps });
}

export async function handleVerifyCode(
  raw: unknown,
  ip: string | null,
  env: Record<string, string | undefined>,
): Promise<VerifyCodeResult> {
  const context = await createContext(env);
  const deps: VerifyCodeDeps | null = context
    ? {
        rateLimit: async (key) => passesRateLimit(await findAuthLimiter(), key),
        verifyCode: (email, code) =>
          attempt(async () => {
            const { data, error } = await context.client.auth.verifyOtp({
              email,
              token: code,
              type: "email",
            });
            if (error) return { ok: false, failure: classifyCodeError(error) };
            return data.session ? { ok: true } : { ok: false, failure: "error" };
          }),
        destination: (locale, next) => destinationFor(context.client, locale, next),
      }
    : null;
  return processVerifyCode(raw, { ip, deps });
}

export async function handleStartEnrollment(
  env: Record<string, string | undefined>,
): Promise<EnrollmentResult> {
  const context = await createContext(env);
  if (!context) return mapEnrollment(null);
  const { client } = context;
  try {
    const state = await readSessionState(client);
    if (state.status !== "member" || !requiresAal2(state.role) || state.level === "aal2") {
      return mapEnrollment({ ok: false, failure: "unauthenticated" });
    }
    const factors = await client.auth.mfa.listFactors();
    if (factors.error) return mapEnrollment({ ok: false, failure: "error" });
    if (factors.data.totp.length > 0) {
      return mapEnrollment({ ok: false, failure: "already_enrolled" });
    }
    for (const factor of factors.data.all) {
      if (factor.factor_type === "totp" && factor.status === "unverified") {
        await client.auth.mfa.unenroll({ factorId: factor.id });
      }
    }
    const { data, error } = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: factorName,
      issuer: factorName,
    });
    if (error) {
      const failure = classifyCodeError(error);
      return mapEnrollment({
        ok: false,
        failure: failure === "rate_limited" ? "rate_limited" : "error",
      });
    }
    if (!data.totp.qr_code.startsWith("data:image/")) {
      return mapEnrollment({ ok: false, failure: "error" });
    }
    const start: EnrollStart = {
      ok: true,
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    };
    return mapEnrollment(start);
  } catch {
    return mapEnrollment({ ok: false, failure: "error" });
  }
}

export async function handleVerifyTotp(
  raw: unknown,
  env: Record<string, string | undefined>,
): Promise<VerifyTotpResult> {
  const context = await createContext(env);
  const deps: TotpDeps | null = context
    ? {
        verifyTotp: (factorId, code) =>
          attempt(async () => {
            const state = await readSessionState(context.client);
            if (state.status !== "member" || !requiresAal2(state.role)) {
              return { ok: false, failure: "unauthenticated" };
            }
            const { error } = await context.client.auth.mfa.challengeAndVerify({ factorId, code });
            return error ? { ok: false, failure: classifyCodeError(error) } : { ok: true };
          }),
        destination: (locale, next) => destinationFor(context.client, locale, next),
      }
    : null;
  return processVerifyTotp(raw, { deps });
}

export async function handleStartGoogle(
  raw: unknown,
  env: Record<string, string | undefined>,
): Promise<GoogleStartResult> {
  if (!features.googleSignIn) return { status: "unavailable" };
  const parsed = googleStartSchema.safeParse(raw);
  const context = await createContext(env);
  if (!parsed.success || !context) return { status: "unavailable" };
  try {
    const callback = new URL("/auth/callback", site.origin);
    callback.searchParams.set("locale", parsed.data.locale);
    if (parsed.data.next) callback.searchParams.set("next", parsed.data.next);
    const { data, error } = await context.client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString(), skipBrowserRedirect: true },
    });
    if (error) return { status: "error" };
    const target = new URL(data.url);
    if (target.origin !== new URL(context.config.supabaseUrl).origin) return { status: "error" };
    return { status: "redirect", url: target.toString() };
  } catch {
    return { status: "error" };
  }
}

export async function handleSignOut(env: Record<string, string | undefined>): Promise<void> {
  const client = await createSupabaseServerClient(env);
  if (!client) return;
  try {
    await client.auth.signOut({ scope: "local" });
  } catch {
    return;
  }
}
