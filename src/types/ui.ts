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
