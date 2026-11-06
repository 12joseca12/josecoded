import { z } from "zod";

export const omenContextSchema = z.object({
  conversation: z.object({
    id: z.uuid(),
    kind: z.enum(["visitor", "closer", "client", "freelance"]),
    locale: z.enum(["es", "en"]),
    ai_enabled: z.boolean(),
    consent_state: z.enum(["granted", "revoked", "pending", "n/a"]),
  }),
  members: z.array(
    z.object({
      role: z.enum(["owner", "closer", "client", "freelance"]),
      display_name: z.string(),
    }),
  ),
  messages: z
    .array(
      z.object({
        author_kind: z.enum(["human", "nexo", "system"]),
        role: z.string().nullable(),
        body: z.string(),
        created_at: z.string(),
      }),
    )
    .max(30),
  project: z
    .object({
      name: z.string(),
      phase: z.enum(["discover", "design", "build", "publish", "maintain"]),
      brief: z.string().nullable(),
    })
    .optional(),
  visitor: z.object({ first_page_path: z.string().nullable() }).optional(),
});

export type OmenContext = z.infer<typeof omenContextSchema>;
