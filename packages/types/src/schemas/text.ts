import { z } from 'zod';

/**
 * Free text from a visitor (gateway inputs): ASCII control characters (except tab and newline) are removed before the
 * length checks, so a payload cannot smuggle terminal or log-injection sequences into Telegram, the CRM or a prompt.
 */
 
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const cleanText = (max: number) =>
  z
    .string()
    .max(max * 4)
    .transform((value) => value.replace(CONTROL_CHARS, '').trim())
    .pipe(z.string().min(1).max(max));

/** Cloudflare Turnstile response token (opaque, at most 2048 characters per the documentation). */
export const turnstileTokenSchema = z.string().min(1).max(2048);
