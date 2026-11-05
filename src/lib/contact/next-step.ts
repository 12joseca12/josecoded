import type { WayId } from "@/types/services";

export interface NextStepTarget {
  href: string;
  external: boolean;
}

export function nextStepTarget(locale: string, way: WayId): NextStepTarget {
  if (way === "contratacion") {
    return { href: `/cv/cv-jose-carlos-sanchez-${locale}.pdf`, external: true };
  }
  if (way === "freelance") return { href: `/${locale}/como-trabajo`, external: false };
  return { href: `/${locale}/proyectos`, external: false };
}
