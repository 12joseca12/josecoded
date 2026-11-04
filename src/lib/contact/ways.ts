import type { Database } from "@/types/database";
import type { WayId } from "@/types/services";

export type LeadVia = Database["public"]["Enums"]["contact_via"];

export const viaByWay: Record<WayId, LeadVia> = {
  contratacion: "hiring",
  freelance: "freelance",
  packs: "pack",
};

const wayByParam: Record<string, WayId> = {
  hiring: "contratacion",
  contratacion: "contratacion",
  freelance: "freelance",
  pack: "packs",
  packs: "packs",
};

interface ContactParams {
  via?: string | string[] | undefined;
  pack?: string | string[] | undefined;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const formAnchor = "#formulario";

export function buildContactHref(locale: string, way: WayId, pack?: string): string {
  const params = new URLSearchParams({ via: viaByWay[way] });
  if (way === "packs" && pack) params.set("pack", pack);
  return `/${locale}/contacto?${params.toString()}${formAnchor}`;
}

export function resolveInitialWay(params: ContactParams): WayId | null {
  const via = first(params.via);
  if (via !== undefined) {
    const way = wayByParam[via.toLowerCase()];
    if (way) return way;
  }
  return first(params.pack) ? "packs" : null;
}
