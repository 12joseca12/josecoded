export const wayIds = ["contratacion", "freelance", "project"] as const;
export type WayId = (typeof wayIds)[number];

export const servicePageIds = ["hub", "freelance", "offers"] as const;
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

export const bentoAreas = ["hiring", "project", "support", "proof"] as const;
export type BentoArea = (typeof bentoAreas)[number];

export const bentoTones = ["need", "quiet", "dark"] as const;
export type BentoTone = (typeof bentoTones)[number];

export const bentoLinkVariants = ["stretch", "inline"] as const;
export type BentoLinkVariant = (typeof bentoLinkVariants)[number];

export interface BentoLinkData {
  href: string;
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

export interface OfferCardItem {
  slug: string;
  name: string;
  audience: string;
  includes: string[];
  excludes: string[];
  price: string;
  provisional: boolean;
  weeks: string;
  drivers?: string;
  ctaHref: string;
  ctaLabel: string;
}

export interface OfferTabGroup {
  id: string;
  label: string;
  items: OfferCardItem[];
}

export interface ExtraChipItem {
  slug: string;
  name: string;
  text: string;
  tags: string[];
  included: string;
}

export interface CostLine {
  id: string;
  label: string;
  text: string;
}

export interface NeedFromYouItem {
  slug: string;
  name: string;
  bullets: string[];
}

export interface MaintenancePlan {
  id: string;
  name: string;
  hours: string;
  text: string;
}

export interface TaskExampleItem {
  id: string;
  title: string;
  text: string;
  size: string;
  deliverable: string;
}

export interface TermItem {
  id: string;
  title: string;
  text: string;
}

export interface Availability {
  weeklyHours?: string;
  from?: string;
  updatedAt: string;
}
