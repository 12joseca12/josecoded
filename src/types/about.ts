export const factListVariants = ["plain", "numbered"] as const;
export type FactListVariant = (typeof factListVariants)[number];

export const modalities = ["remote", "hybrid", "remoteOrHybrid"] as const;
export type Modality = (typeof modalities)[number];

export interface FactItem {
  id: string;
  title: string;
  text: string;
}

export interface StackItemRow {
  name: string;
  detail: string | null;
}

export interface StackGroupBlock {
  id: string;
  title: string;
  listLabel: string;
  items: StackItemRow[];
}

export interface TimelineRow {
  period: string | null;
  title: string;
  organization: string | null;
  summary: string | null;
  highlights: string[];
}

export interface ProfileLinkRow {
  id: string;
  label: string;
  href: string;
}

export interface TocItem {
  id: string;
  label: string;
}
