import type { UserRole, Zone } from "@/types/auth";

const aal2Roles: readonly UserRole[] = ["admin", "closer", "freelance"];

const zoneByRole: Record<UserRole, Zone> = {
  admin: "admin",
  closer: "crm",
  freelance: "freelance",
  client: "area",
};

const zonesByRole: Record<UserRole, readonly Zone[]> = {
  admin: ["admin", "crm", "freelance", "area"],
  closer: ["crm"],
  freelance: ["freelance"],
  client: ["area"],
};

export function requiresAal2(role: UserRole): boolean {
  return aal2Roles.includes(role);
}

export function homeZone(role: UserRole): Zone {
  return zoneByRole[role];
}

export function canEnterZone(role: UserRole, zone: Zone): boolean {
  return zonesByRole[role].includes(zone);
}

export function zonePath(locale: string, zone: Zone): string {
  return `/${locale}/${zone}`;
}

export function zoneOfPath(locale: string, path: string): Zone | null {
  const [, pathLocale, segment] = path.split("?")[0]?.split("/") ?? [];
  if (pathLocale !== locale) return null;
  switch (segment) {
    case "admin":
    case "crm":
    case "freelance":
    case "area":
      return segment;
    default:
      return null;
  }
}
