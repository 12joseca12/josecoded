import type { Locale } from "@/i18n/config";

export interface PublicRoute {
  path: string;
  priority: number;
  needsProjects?: boolean;
  needsContact?: boolean;
}

export const publicRoutes: readonly PublicRoute[] = [
  { path: "", priority: 1 },
  { path: "/servicios", priority: 0.9 },
  { path: "/servicios/freelance", priority: 0.9 },
  { path: "/servicios/a-medida", priority: 0.9 },
  { path: "/proyectos", priority: 0.8, needsProjects: true },
  { path: "/contacto", priority: 0.7, needsContact: true },
];

export const privatePrefixes = [
  "/admin",
  "/crm",
  "/area",
  "/freelance",
  "/dev",
  "/entrar",
  "/invitacion",
  "/cuenta",
] as const;

export const rootPrivatePrefixes = ["/api/"] as const;

export const openGraphLocales: Record<Locale, string> = { es: "es_ES", en: "en_US" };

export function localePath(locale: Locale, path: string): string {
  return `/${locale}${path}`;
}

export function absoluteUrl(origin: string, path: string): string {
  return `${origin}${path}`;
}
