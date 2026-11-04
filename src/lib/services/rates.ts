import { z } from "zod";

export const rateStatuses = ["provisional", "final"] as const;

export const ratesSchema = z.strictObject({
  status: z.enum(rateStatuses),
  hour: z.string().min(1),
  task: z.string().min(1),
});

export type Rates = z.infer<typeof ratesSchema>;

export interface PublicRates {
  hour: string;
  task: string;
}

export const rates: Rates = ratesSchema.parse({
  status: "provisional",
  hour: "00",
  task: "000",
});

export function isProvisional(value: Rates): boolean {
  return value.status === "provisional";
}

export function publicRates(value: Rates): PublicRates | null {
  return isProvisional(value) ? null : { hour: value.hour, task: value.task };
}
