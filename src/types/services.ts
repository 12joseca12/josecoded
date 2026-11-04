export const wayIds = ["contratacion", "freelance", "packs"] as const;
export type WayId = (typeof wayIds)[number];

export const servicePageIds = ["hub", "freelance", "packs"] as const;
export type ServicePageId = (typeof servicePageIds)[number];

export const wayNavVariants = ["anchors", "pages"] as const;
export type WayNavVariant = (typeof wayNavVariants)[number];

export interface WayNavItem {
  id: WayId;
  label: string;
  href: string;
}

export interface RateItem {
  id: string;
  label: string;
  value: string;
  unit: string;
  prefix?: string;
}

export const bentoAreas = ["hiring", "project", "support", "phases", "proof"] as const;
export type BentoArea = (typeof bentoAreas)[number];

export const bentoTones = ["need", "quiet", "dark"] as const;
export type BentoTone = (typeof bentoTones)[number];

export const bentoLinkVariants = ["stretch", "inline"] as const;
export type BentoLinkVariant = (typeof bentoLinkVariants)[number];

export interface NeedFigure {
  caption: string;
  prefix?: string;
  value: string;
  unit: string;
  provisionalLabel?: string;
}

export interface BentoLinkData {
  href: string;
  label: string;
}

export interface PhaseChip {
  id: string;
  label: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface StepItem {
  id: string;
  title: string;
  text: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PackCardItem {
  slug: string;
  name: string;
  text: string;
  bullets: string[];
  price: string;
  provisional: boolean;
  ctaHref: string;
  ctaLabel: string;
}
