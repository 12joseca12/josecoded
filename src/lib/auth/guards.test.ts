import { describe, expect, it } from "vitest";

import type { UserRole } from "@/types/auth";

import {
  decideAccess,
  isSessionPath,
  loginPath,
  needsSecondFactor,
  resolveDestination,
  safeNext,
  secondFactorPath,
  type SessionState,
} from "./guards";
import { canEnterZone, homeZone, requiresAal2, zoneOfPath } from "./roles";

function member(role: UserRole, level: "aal1" | "aal2"): SessionState {
  return { status: "member", userId: "u", email: "a@b.co", fullName: "A", role, level };
}

describe("role mapping", () => {
  it("requires aal2 for admin, closer and freelance only", () => {
    expect(requiresAal2("admin")).toBe(true);
    expect(requiresAal2("closer")).toBe(true);
    expect(requiresAal2("freelance")).toBe(true);
    expect(requiresAal2("client")).toBe(false);
  });

  it("sends each role to its own zone", () => {
    expect(homeZone("admin")).toBe("admin");
    expect(homeZone("closer")).toBe("crm");
    expect(homeZone("freelance")).toBe("freelance");
    expect(homeZone("client")).toBe("area");
  });

  it("lets only the admin into every zone", () => {
    for (const zone of ["admin", "crm", "freelance", "area"] as const) {
      expect(canEnterZone("admin", zone)).toBe(true);
    }
    expect(canEnterZone("closer", "crm")).toBe(true);
    expect(canEnterZone("closer", "admin")).toBe(false);
    expect(canEnterZone("freelance", "crm")).toBe(false);
    expect(canEnterZone("client", "admin")).toBe(false);
    expect(canEnterZone("client", "area")).toBe(true);
  });

  it("reads the zone from a localized path", () => {
    expect(zoneOfPath("es", "/es/admin/interesados?x=1")).toBe("admin");
    expect(zoneOfPath("es", "/es/crm")).toBe("crm");
    expect(zoneOfPath("es", "/en/admin")).toBeNull();
    expect(zoneOfPath("es", "/es/contacto")).toBeNull();
  });
});

describe("decideAccess", () => {
  it("sends anonymous visitors to log in", () => {
    expect(decideAccess({ status: "anonymous" }, "admin")).toEqual({ kind: "login" });
  });

  it("answers 404 for inactive profiles", () => {
    expect(decideAccess({ status: "inactive" }, "admin")).toEqual({ kind: "not-found" });
  });

  it("answers 404 for a zone that is not theirs, before asking for aal2", () => {
    expect(decideAccess(member("client", "aal1"), "admin")).toEqual({ kind: "not-found" });
    expect(decideAccess(member("closer", "aal1"), "admin")).toEqual({ kind: "not-found" });
    expect(decideAccess(member("freelance", "aal2"), "crm")).toEqual({ kind: "not-found" });
  });

  it("asks staff at aal1 for the second factor", () => {
    expect(decideAccess(member("admin", "aal1"), "admin")).toEqual({ kind: "second-factor" });
    expect(decideAccess(member("closer", "aal1"), "crm")).toEqual({ kind: "second-factor" });
  });

  it("lets staff at aal2 and clients at aal1 in", () => {
    expect(decideAccess(member("admin", "aal2"), "admin")).toEqual({ kind: "allow" });
    expect(decideAccess(member("client", "aal1"), "area")).toEqual({ kind: "allow" });
  });

  it("flags who still needs the second factor", () => {
    expect(needsSecondFactor(member("admin", "aal1"))).toBe(true);
    expect(needsSecondFactor(member("admin", "aal2"))).toBe(false);
    expect(needsSecondFactor(member("client", "aal1"))).toBe(false);
    expect(needsSecondFactor({ status: "anonymous" })).toBe(false);
  });
});

describe("safeNext", () => {
  it("keeps local zone paths", () => {
    expect(safeNext("es", "/es/admin/interesados")).toBe("/es/admin/interesados");
    expect(safeNext("es", "/es/crm?tab=1")).toBe("/es/crm?tab=1");
  });

  it("keeps invitation links and nothing broader", () => {
    expect(safeNext("es", "/es/invitacion/Ab3-_9xZ")).toBe("/es/invitacion/Ab3-_9xZ");
    expect(safeNext("es", "/es/invitacion/Ab3?x=1")).toBe("/es/invitacion/Ab3?x=1");
    for (const value of [
      "/es/invitacion",
      "/es/invitacion/",
      "/es/invitacion/a/b",
      "/es/invitacion/a%2Fb",
      "/es/invitacion/a#frag",
      "/en/invitacion/abc",
      "/es/invitacion//abc",
      `/es/invitacion/${"a".repeat(129)}`,
    ]) {
      expect(safeNext("es", value)).toBeNull();
    }
  });

  it("drops everything else", () => {
    for (const value of [
      null,
      undefined,
      "",
      "https://evil.example/es/admin",
      "//evil.example/es/admin",
      "/es//evil.example",
      "/es/admin\\evil",
      "/en/admin",
      "/es/contacto",
      "/es/admin\n",
      `/es/admin/${"a".repeat(400)}`,
    ]) {
      expect(safeNext("es", value)).toBeNull();
    }
  });
});

describe("destinations", () => {
  it("builds login and second-factor paths with a safe next", () => {
    expect(loginPath("es")).toBe("/es/entrar");
    expect(loginPath("es", "/es/admin")).toBe("/es/entrar?next=%2Fes%2Fadmin");
    expect(loginPath("es", "https://evil.example")).toBe("/es/entrar");
    expect(secondFactorPath("es", "/es/admin")).toBe("/es/entrar/totp?next=%2Fes%2Fadmin");
  });

  it("resolves where a session goes next", () => {
    expect(resolveDestination({ status: "anonymous" }, "es", "/es/admin")).toBe(
      "/es/entrar?next=%2Fes%2Fadmin",
    );
    expect(resolveDestination(member("admin", "aal1"), "es", "/es/admin/interesados")).toBe(
      "/es/entrar/totp?next=%2Fes%2Fadmin%2Finteresados",
    );
    expect(resolveDestination(member("admin", "aal2"), "es", "/es/admin/interesados")).toBe(
      "/es/admin/interesados",
    );
    expect(resolveDestination(member("admin", "aal2"), "es")).toBe("/es/admin");
    expect(resolveDestination(member("client", "aal1"), "es", "/es/admin")).toBe("/es/area");
    expect(resolveDestination(member("closer", "aal2"), "es")).toBe("/es/crm");
    expect(resolveDestination(member("client", "aal1"), "es", "/es/invitacion/abc")).toBe(
      "/es/invitacion/abc",
    );
    expect(resolveDestination(member("closer", "aal1"), "es", "/es/invitacion/abc")).toBe(
      "/es/entrar/totp?next=%2Fes%2Finvitacion%2Fabc",
    );
  });

  it("lets a session without a profile reach an invitation and nothing else", () => {
    const inactive: SessionState = { status: "inactive" };
    expect(resolveDestination(inactive, "es", "/es/invitacion/abc")).toBe("/es/invitacion/abc");
    expect(resolveDestination(inactive, "es", "/es/admin")).toBe("/es/entrar?next=%2Fes%2Fadmin");
    expect(resolveDestination(inactive, "es")).toBe("/es/entrar");
    expect(resolveDestination(inactive, "es", "/en/invitacion/abc")).toBe("/es/entrar");
  });
});

describe("isSessionPath", () => {
  it("matches the auth and private zones only", () => {
    for (const path of ["/es/entrar", "/es/entrar/totp", "/es/admin", "/en/crm/x", "/es/cuenta"]) {
      expect(isSessionPath(path)).toBe(true);
    }
    for (const path of ["/es", "/es/contacto", "/es/administrar", "/es/dev/ui", "/auth/callback"]) {
      expect(isSessionPath(path)).toBe(false);
    }
  });
});
