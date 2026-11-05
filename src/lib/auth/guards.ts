import type { AssuranceLevel, UserRole, Zone } from "@/types/auth";

import { canEnterZone, homeZone, requiresAal2, zoneOfPath, zonePath } from "./roles";

export const requestPathHeader = "x-josecoded-path";

const sessionPathPattern = /^\/(es|en)\/(entrar|admin|crm|area|freelance|cuenta|invitacion)(\/|$)/;

export function isSessionPath(pathname: string): boolean {
  return sessionPathPattern.test(pathname);
}

export type SessionState =
  | { status: "anonymous" }
  | { status: "inactive" }
  | {
      status: "member";
      userId: string;
      email: string | null;
      fullName: string;
      role: UserRole;
      level: AssuranceLevel;
    };

export type Access =
  { kind: "allow" } | { kind: "login" } | { kind: "second-factor" } | { kind: "not-found" };

export function needsSecondFactor(state: SessionState): boolean {
  return state.status === "member" && requiresAal2(state.role) && state.level !== "aal2";
}

export function decideAccess(state: SessionState, zone: Zone): Access {
  if (state.status === "anonymous") return { kind: "login" };
  if (state.status === "inactive") return { kind: "not-found" };
  if (!canEnterZone(state.role, zone)) return { kind: "not-found" };
  if (needsSecondFactor(state)) return { kind: "second-factor" };
  return { kind: "allow" };
}

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((char) => {
    const code = char.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

const invitationPathPattern = /^\/(es|en)\/invitacion\/[A-Za-z0-9_-]{1,128}(\?[^#]*)?$/;

export function isInvitationPath(locale: string, value: string): boolean {
  return value.startsWith(`/${locale}/`) && invitationPathPattern.test(value);
}

export function safeNext(locale: string, value: string | null | undefined): string | null {
  if (!value || value.length > 300) return null;
  if (!value.startsWith(`/${locale}/`)) return null;
  if (value.includes("\\") || value.includes("//") || hasControlCharacter(value)) return null;
  if (isInvitationPath(locale, value)) return value;
  return zoneOfPath(locale, value) === null ? null : value;
}

export function loginPath(locale: string, next?: string | null): string {
  const base = `/${locale}/entrar`;
  const target = safeNext(locale, next);
  return target ? `${base}?next=${encodeURIComponent(target)}` : base;
}

export function secondFactorPath(locale: string, next?: string | null): string {
  const base = `/${locale}/entrar/totp`;
  const target = safeNext(locale, next);
  return target ? `${base}?next=${encodeURIComponent(target)}` : base;
}

export function resolveDestination(
  state: SessionState,
  locale: string,
  next?: string | null,
): string {
  if (state.status === "inactive") {
    const invitation = safeNext(locale, next);
    if (invitation && isInvitationPath(locale, invitation)) return invitation;
  }
  if (state.status !== "member") return loginPath(locale, next);
  if (needsSecondFactor(state)) return secondFactorPath(locale, next);
  const target = safeNext(locale, next);
  if (target && isInvitationPath(locale, target)) return target;
  const targetZone = target ? zoneOfPath(locale, target) : null;
  if (target && targetZone && canEnterZone(state.role, targetZone)) return target;
  return zonePath(locale, homeZone(state.role));
}
