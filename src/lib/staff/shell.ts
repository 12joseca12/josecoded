import "server-only";

import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { canEnterZone, homeZone } from "@/lib/auth/roles";
import type { UserRole } from "@/types/auth";
import type { StaffNavItem, StaffShellLabels, StaffSwitch, StaffZone } from "@/types/staff";

import { staffNav } from "./nav";

interface StaffShellData {
  homeHref: string;
  accountHref: string | null;
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
    accountHref: `/${locale}/cuenta`,
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
      account: t("account.menuLink"),
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

export async function getAccountShell(locale: Locale, role: UserRole): Promise<StaffShellData> {
  const t = await getTranslator(locale);
  const account = `/${locale}/cuenta`;
  const zone = homeZone(role);
  const items: StaffNavItem[] = [
    { key: "account", href: account, label: t("account.nav.account"), ready: true },
  ];
  if (zone === "admin" || zone === "crm" || zone === "area") {
    items.push({
      key: "back",
      href: `/${locale}/${zone}`,
      label: t("account.nav.back"),
      ready: true,
    });
  }
  return {
    homeHref: items[1]?.href ?? `/${locale}`,
    accountHref: null,
    items,
    labels: {
      skipLink: t("nav.skipLink"),
      brandLabel: t("account.brandLabel"),
      brandWord: t("account.brandWord"),
      navLabel: t("account.navLabel"),
      userLabel: t("account.userLabel"),
      account: t("account.menuLink"),
      signOut: t("account.signOut"),
      signingOut: t("account.signingOut"),
      soon: t("account.nav.soon"),
      more: t("account.nav.more"),
      moreTitle: t("account.nav.moreTitle"),
      close: t("account.nav.close"),
    },
    zoneSwitch: null,
  };
}
