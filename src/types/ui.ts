export const buttonVariants = ["primary", "accent", "light", "ghost"] as const;
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

export const toastTones = ["success", "error", "info"] as const;
export type ToastTone = (typeof toastTones)[number];

export interface ToastItem {
  id: number;
  tone: ToastTone;
  title?: string;
  message: string;
}

export type ToastInput = Omit<ToastItem, "id">;
