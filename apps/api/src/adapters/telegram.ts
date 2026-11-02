// Real adapters over the Telegram Bot API (DATOS §8.4): the Notifier port (`sendMessage`, to Jose's chat or to the chat of a
// staff member who linked his Telegram) and the inbox that reads `/start <code>` messages (`getUpdates`, task 3.8b).
import { z } from 'zod';

import { telegramUpdateSchema, type TelegramUpdate } from '../utils/telegram-update';

import type { Env } from '../types/env.types';
import type { Notifier } from '@josecoded/types';

/** Telegram rejects longer texts (4096 characters). */
const MAX_TEXT = 4000;

/** `undefined` unless both TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID are set. */
export function createTelegramNotifier(env: Env, fetchImpl: typeof fetch = fetch): Notifier | undefined {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (!token || !chatId) return undefined;
  return {
    async sendMessage(text, to) {
      let res: Response;
      try {
        res = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          // plain text (no parse_mode): payload values such as a comment author's name are never markup
          body: JSON.stringify({ chat_id: to ?? chatId, text: text.slice(0, MAX_TEXT), disable_web_page_preview: true }),
        });
      } catch {
        // a network error may embed the request URL, which carries the bot token: it must never reach
        // private.outbox.last_error, the logs or system.outbox_dead
        throw new Error('telegram sendMessage network error');
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { description?: unknown } | null;
        const description = typeof body?.description === 'string' ? `: ${body.description.slice(0, 200)}` : '';
        // the URL carries the token: the error names only the status and Telegram's description
        throw new Error(`telegram sendMessage ${res.status}${description}`);
      }
    },
  };
}

/** Reads the bot's pending updates (`getUpdates`). Polling mode only: Telegram refuses it while a webhook is set. */
export interface TelegramInbox {
  /** Updates with `update_id >= offset` (all unconfirmed ones when 0); asking with `offset = n + 1` confirms every update up to `n`. */
  getUpdates(offset: number, limit: number): Promise<TelegramUpdate[]>;
}

export function createTelegramInbox(env: Env, fetchImpl: typeof fetch = fetch): TelegramInbox | undefined {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return undefined;
  return {
    async getUpdates(offset, limit) {
      let res: Response;
      try {
        res = await fetchImpl(`https://api.telegram.org/bot${token}/getUpdates`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ offset, limit, timeout: 0, allowed_updates: ['message'] }),
        });
      } catch {
        throw new Error('telegram getUpdates network error');
      }
      if (!res.ok) throw new Error(`telegram getUpdates ${res.status}`);
      const body = (await res.json().catch(() => null)) as { result?: unknown } | null;
      const parsed = z.array(z.unknown()).safeParse(body?.result);
      if (!parsed.success) return [];
      // one malformed update must not block the others (nor the confirmation of the queue)
      return parsed.data.flatMap((u) => {
        const update = telegramUpdateSchema.safeParse(u);
        return update.success ? [update.data] : [];
      });
    },
  };
}
