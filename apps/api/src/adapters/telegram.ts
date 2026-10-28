// Real adapter of the Notifier port: Telegram Bot API `sendMessage` to Jose's chat (DATOS §8.4).
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
    async sendMessage(text) {
      let res: Response;
      try {
        res = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          // plain text (no parse_mode): payload values such as a comment author's name are never markup
          body: JSON.stringify({ chat_id: chatId, text: text.slice(0, MAX_TEXT), disable_web_page_preview: true }),
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
