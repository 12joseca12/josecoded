export const buttonVariants = ["primary", "accent", "light", "quiet", "ghost"] as const;
export type ButtonVariant = (typeof buttonVariants)[number];

export const buttonSizes = ["md", "sm"] as const;
export type ButtonSize = (typeof buttonSizes)[number];

export const linkVariants = ["inline", "arrow"] as const;
export type LinkVariant = (typeof linkVariants)[number];

export const headingLevels = [1, 2, 3, 4] as const;
export type HeadingLevel = (typeof headingLevels)[number];

export const headingSizes = ["h1", "h2", "h3", "h4"] as const;
export type HeadingSize = (typeof headingSizes)[number];

export const skeletonShapes = ["text", "block", "circle"] as const;
export type SkeletonShape = (typeof skeletonShapes)[number];

export const cardTones = ["panel", "glass", "error"] as const;
export type CardTone = (typeof cardTones)[number];

export const cardElevations = ["card", "float"] as const;
export type CardElevation = (typeof cardElevations)[number];

export const cardSizes = ["sm", "md", "lg"] as const;
export type CardSize = (typeof cardSizes)[number];

export const priceStateVariants = ["review", "range", "final"] as const;
export type PriceStateVariant = (typeof priceStateVariants)[number];

export const priceStateSizes = ["md", "lg"] as const;
export type PriceStateSize = (typeof priceStateSizes)[number];

export const toastTones = ["success", "error", "info"] as const;
export type ToastTone = (typeof toastTones)[number];

export interface ToastItem {
  id: number;
  tone: ToastTone;
  title?: string;
  message: string;
}

export type ToastInput = Omit<ToastItem, "id">;

export const pageSectionSizes = ["narrow", "wide"] as const;
export type PageSectionSize = (typeof pageSectionSizes)[number];

export const pageSectionFits = ["screen", "content"] as const;
export type PageSectionFit = (typeof pageSectionFits)[number];
