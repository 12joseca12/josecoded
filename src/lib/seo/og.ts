export const ogSize = { width: 1200, height: 630 } as const;
export const ogContentType = "image/png";
export const ogDirectory = "og";

export const ogPalette = {
  charcoal: "#17191c",
  steel: "#929da7",
  coral: "#ff4b32",
  onDark: "#f4f5f6",
} as const;

export const ogTitleKeys = {
  home: "home.metaTitle",
  services: "services.meta.title",
  freelance: "freelancePage.meta.title",
  custom: "offersPage.meta.title",
  how: "howPage.meta.title",
  about: "about.meta.title",
  contact: "contactPage.meta.title",
} as const;

export type OgPage = keyof typeof ogTitleKeys;

export function ogImagePath(locale: string, page: OgPage): string {
  return `/${ogDirectory}/${locale}-${page}.png`;
}

export function ogTitleSize(title: string): number {
  if (title.length <= 28) return 92;
  if (title.length <= 44) return 76;
  return 64;
}
