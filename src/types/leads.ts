import { z } from "zod";

export const leadVias = ["hiring", "freelance", "pack"] as const;
export const leadStatuses = ["new", "assigned", "contacted", "converted", "discarded"] as const;

export const leadRowSchema = z.object({
  id: z.uuid(),
  via: z.enum(leadVias).nullable(),
  full_name: z.string(),
  email: z.string().nullable(),
  status: z.enum(leadStatuses),
  created_at: z.string(),
});

export type LeadRow = z.infer<typeof leadRowSchema>;

export type LeadsResult = { status: "ok"; rows: LeadRow[]; limit: number } | { status: "error" };

export interface LeadTableLabels {
  region: string;
  caption: string;
  columns: { via: string; name: string; email: string; status: string; date: string };
  via: Record<(typeof leadVias)[number] | "none", string>;
  status: Record<(typeof leadStatuses)[number], string>;
  noEmail: string;
}
