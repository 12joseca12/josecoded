import { z } from 'zod';

/** What the bot needs of an update: a private message with text. Anything else is ignored. */
export const telegramUpdateSchema = z.object({
  update_id: z.number().int(),
  message: z
    .object({
      text: z.string().max(4096).optional(),
      chat: z.object({ id: z.number().int(), type: z.string() }),
    })
    .optional(),
});
export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;
