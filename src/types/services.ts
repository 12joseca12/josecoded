export const wayIds = ["contratacion", "freelance", "packs"] as const;
export type WayId = (typeof wayIds)[number];

export interface WayNavItem {
  id: WayId;
  label: string;
}

export interface RateItem {
  id: string;
  label: string;
  value: string;
  unit: string;
}
