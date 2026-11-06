import { z } from "zod";

export const chatReplyResultSchema = z.object({
  body: z.string().min(1).max(4000),
  sources: z.array(z.string().max(200)).max(20),
  model: z
    .string()
    .regex(/^(groq|local):.+$/)
    .max(100),
  interest: z.boolean().nullable(),
  confidence: z.number().min(0).max(1),
});

export type ChatReplyResult = z.infer<typeof chatReplyResultSchema>;
