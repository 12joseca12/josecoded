// Real adapter of the EmailSender port: Resend, fixed templates only (DATOS Q5, task 3.8b). `renderEmail` produces the whole
// message, so this file cannot be asked to send a body of someone's choosing. No address or body is ever logged or
// put in an error: the errors name the status only.
import { z } from 'zod';

import { renderEmail } from '../templates';

import type { Env } from '../types/env.types';
import type { EmailSender } from '@josecoded/types';

const DEFAULT_FROM = 'josecoded.com <no-reply@josecoded.com>';
const recipientSchema = z.email().max(254);

/** `undefined` without RESEND_API_KEY: the events that need an email stay in the outbox (nothing is claimed for them). */
export function createEmailSender(env: Env, fetchImpl: typeof fetch = fetch): EmailSender | undefined {
  const key = env.RESEND_API_KEY?.trim();
  if (!key) return undefined;
  const from = env.EMAIL_FROM?.trim() || DEFAULT_FROM;
  return {
    async sendEmail({ templateId, to, locale, vars, idempotencyKey }) {
      const mail = renderEmail(templateId, locale, vars); // throws for an unknown template or bad variables
      const address = recipientSchema.safeParse(to);
      if (!address.success) throw new Error('invalid_email_recipient');
      let res: Response;
      try {
        res = await fetchImpl('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${key}`,
            'content-type': 'application/json',
            ...(idempotencyKey ? { 'idempotency-key': idempotencyKey.slice(0, 256) } : {}),
          },
          body: JSON.stringify({ from, to: [address.data], subject: mail.subject, text: mail.text, html: mail.html }),
        });
      } catch {
        throw new Error('resend network error');
      }
      if (!res.ok) throw new Error(`resend ${res.status}`);
    },
  };
}
