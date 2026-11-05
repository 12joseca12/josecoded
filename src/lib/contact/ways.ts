import type { Database } from "@/types/database";
import type { WayId } from "@/types/services";

import { type OfferSelection, selectionParams } from "./selection";

export type LeadVia = Database["public"]["Enums"]["contact_via"];

export const viaByWay: Record<WayId, LeadVia> = {
  contratacion: "hiring",
  freelance: "freelance",
  project: "project",
};

const paramByWay: Record<WayId, string> = {
  contratacion: "hiring",
  freelance: "freelance",
  project: "project",
};

const wayByParam: Record<string, WayId> = {
  hiring: "contratacion",
  contratacion: "contratacion",
  freelance: "freelance",
  project: "project",
  pack: "project",
  packs: "project",
};

interface ContactParams {
  via?: string | string[] | undefined;
  pack?: string | string[] | undefined;
  offer?: string | string[] | undefined;
  extras?: string | string[] | undefined;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const formAnchor = "#formulario";

export function buildContactHref(locale: string, way: WayId, selection?: OfferSelection): string {
  const params = new URLSearchParams({ via: paramByWay[way] });
  if (way === "project" && selection) {
    for (const [name, value] of selectionParams(selection)) params.set(name, value);
  }
  return `/${locale}/contacto?${params.toString().replaceAll("%2C", ",")}${formAnchor}`;
}

export function resolveInitialWay(params: ContactParams): WayId | null {
  const via = first(params.via);
  if (via !== undefined) {
    const way = wayByParam[via.toLowerCase()];
    if (way) return way;
  }
  return first(params.offer) || first(params.extras) || first(params.pack) ? "project" : null;
}
