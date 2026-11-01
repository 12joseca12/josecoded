import { z } from 'zod';

import { chatMessageTypeSchema, chatSenderSchema, threadStatusSchema } from './chat.ts';
import { chatCaseSchema } from './crm.ts';
import { cleanText, turnstileTokenSchema } from './text.ts';

// Gateway contract of /api/v1/assistant/* (plan 4.4, DATOS §4.6, spec §0.4): chat by case without an account. The
// visitor is identified by the signed `chat_sid` cookie, never by anything in the body.

const locale = z.enum(['es', 'en']);

export const MAX_CHAT_MESSAGE_CHARS = 1000;

export const createThreadRequestSchema = z.object({
  case: chatCaseSchema,
  locale,
  originPath: z
    .string()
    .max(200)
    .regex(/^\/(?!\/)[\w\-./#?=&%~]*$/)
    .default('/'),
  turnstileToken: turnstileTokenSchema,
});

export const postMessageRequestSchema = z.object({ content: cleanText(MAX_CHAT_MESSAGE_CHARS) });
export const switchCaseRequestSchema = z.object({ case: chatCaseSchema });

export const quickContactRequestSchema = z
  .object({
    channel: z.enum(['email', 'phone', 'whatsapp']),
    name: cleanText(120).optional(),
    email: z.email().max(320).optional(),
    phone: z
      .string()
      .trim()
      .min(6)
      .max(32)
      .regex(/^[+\d][\d\s().-]*$/)
      .optional(),
  })
  .refine((v) => v.email !== undefined || v.phone !== undefined, {
    path: ['email'],
    message: 'email or phone is required',
  });

export const adminReplyRequestSchema = z.object({ content: cleanText(4000) });
export const adminAiRequestSchema = z.object({ enabled: z.boolean() });

/** A message as the visitor sees it: no metadata (it may hold internal flags). */
export const chatMessageViewSchema = z.object({
  id: z.uuid(),
  sender_role: chatSenderSchema,
  content: z.string(),
  message_type: chatMessageTypeSchema,
  created_at: z.string(),
});

export const chatThreadViewSchema = z.object({
  id: z.uuid(),
  case: chatCaseSchema,
  locale,
  status: threadStatusSchema,
  ai_enabled: z.boolean(),
  context_version: z.number().int().nullable(),
});

export type CreateThreadRequest = z.infer<typeof createThreadRequestSchema>;
export type ChatMessageView = z.infer<typeof chatMessageViewSchema>;
export type ChatThreadView = z.infer<typeof chatThreadViewSchema>;
