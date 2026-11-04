import { z } from "zod";

import { wayIds } from "./services";

export const contactWaySchema = z.strictObject({
  way: z.enum(wayIds),
  email: z.email(),
});

export const contactWaysSchema = z
  .array(contactWaySchema)
  .refine((ways) => new Set(ways.map((entry) => entry.way)).size === ways.length, {
    message: "each way appears once",
  });

export type ContactWay = z.infer<typeof contactWaySchema>;
