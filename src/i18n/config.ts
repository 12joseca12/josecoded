export const locales = ["es", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export const publishedLocales: readonly Locale[] = ["es"];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isPublished(locale: Locale): boolean {
  return publishedLocales.includes(locale);
}
