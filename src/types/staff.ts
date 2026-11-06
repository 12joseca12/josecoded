import { z } from "zod";

export const staffZones = ["admin", "crm", "area", "freelance"] as const;
export const staffZoneSchema = z.enum(staffZones);
export type StaffZone = z.infer<typeof staffZoneSchema>;

export interface StaffNavItem {
  key: string;
  href: string;
  label: string;
  ready: boolean;
}

export interface StaffShellLabels {
  skipLink: string;
  brandLabel: string;
  brandWord: string;
  navLabel: string;
  userLabel: string;
  account: string;
  signOut: string;
  signingOut: string;
  soon: string;
  more: string;
  moreTitle: string;
  close: string;
}

export interface StaffSwitch {
  href: string;
  label: string;
}
