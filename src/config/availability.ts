import type { Modality } from "@/types/about";

interface Availability {
  modality: Modality | null;
  notice: string | null;
}

export const availability: Availability = {
  modality: null,
  notice: null,
};
