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
