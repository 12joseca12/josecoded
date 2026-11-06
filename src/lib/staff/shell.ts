import "server-only";

import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { canEnterZone } from "@/lib/auth/roles";
import type { UserRole } from "@/types/auth";
import type { StaffNavItem, StaffShellLabels, StaffSwitch, StaffZone } from "@/types/staff";

import { staffNav } from "./nav";

interface StaffShellData {
  homeHref: string;
  items: StaffNavItem[];
  labels: StaffShellLabels;
  zoneSwitch: StaffSwitch | null;
}

const otherZone: Partial<Record<StaffZone, StaffZone>> = { admin: "crm", crm: "admin" };

export async function getStaffShell(
  zone: StaffZone,
  locale: Locale,
  role: UserRole,
): Promise<StaffShellData> {
  const t = await getTranslator(locale);
  const home = `/${locale}/${zone}`;
  const other = otherZone[zone];
  const switchLabel: Partial<Record<StaffZone, MessageKey>> = {
    admin: "admin.nav.switch",
    crm: "crm.nav.switch",
  };
  const switchKey = switchLabel[zone];
  return {
    homeHref: home,
    items: staffNav[zone].map((entry) => ({
      key: entry.key,
      href: `${home}${entry.path}`,
      label: t(entry.label),
      ready: entry.ready,
    })),
    labels: {
      skipLink: t("nav.skipLink"),
      brandLabel: t(`${zone}.brandLabel`),
      brandWord: t(`${zone}.brandWord`),
      navLabel: t(`${zone}.navLabel`),
      userLabel: t(`${zone}.userLabel`),
      signOut: t(`${zone}.signOut`),
      signingOut: t(`${zone}.signingOut`),
      soon: t(`${zone}.nav.soon`),
      more: t(`${zone}.nav.more`),
      moreTitle: t(`${zone}.nav.moreTitle`),
      close: t(`${zone}.nav.close`),
    },
    zoneSwitch:
      other !== undefined && switchKey !== undefined && canEnterZone(role, other)
        ? { href: `/${locale}/${other}`, label: t(switchKey) }
        : null,
  };
}
