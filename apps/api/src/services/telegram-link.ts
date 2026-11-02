// Linking a staff member's Telegram (task 3.8b, DATOS §14.4): `staff_telegram_begin()` gives a logged-in member a code of 8
// characters that lives 15 minutes; he sends `/start <code>` to the bot, and the gateway binds that chat to his row with
// `staff_telegram_link`. The same logic serves the webhook route and the polling job. Only that one command is understood:
// anything else the bot receives is ignored without an answer, so the bot cannot be used to make it talk.
import { logEvent } from '../utils/http-error';

import type { Deps } from '../deps';
import type { TelegramUpdate } from '../utils/telegram-update';

/** `/start` or `/start@botname`, then the code. Telegram deep links send exactly this. */
const START = /^\/start(?:@[A-Za-z0-9_]{1,64})?[ \t]+([A-Za-z0-9]{8})[ \t]*$/;

/** Codes tried per chat per window: the code space is 2^32 and lives 15 minutes, this keeps guessing out of reach. */
export const LINK_ATTEMPTS = 5;
export const LINK_WINDOW_SECONDS = 900;

export const LINKED_REPLY = 'Telegram vinculado. Desde ahora recibirás aquí los avisos que te correspondan.';
export const REJECTED_REPLY = 'Código no válido o caducado. Genera uno nuevo en el CRM y envíalo aquí.';

export function parseStartCode(text: string | undefined): string | null {
  return text === undefined ? null : (START.exec(text.trim())?.[1] ?? null);
}

export type LinkOutcome = 'linked' | 'rejected' | 'limited' | 'ignored';

/** Calls one subrequest per outbound call: `spend` lets the polling job count them against its tick. */
export async function handleTelegramUpdate(deps: Deps, update: TelegramUpdate, spend: () => void = () => undefined): Promise<LinkOutcome> {
  const message = update.message;
  const code = message && message.chat.type === 'private' ? parseStartCode(message.text) : null;
  if (!message || !code || !deps.staffTelegram) return 'ignored';
  const chatId = String(message.chat.id);

  if (deps.quota) {
    spend();
    if (!(await deps.quota.hit(`tglink:${chatId}`, LINK_ATTEMPTS, LINK_WINDOW_SECONDS))) {
      logEvent('telegram', 'link_limited');
      return 'limited';
    }
  }
  spend();
  const linked = await deps.staffTelegram.link(code, chatId);
  logEvent('telegram', linked ? 'linked' : 'link_rejected');
  if (deps.telegram) {
    try {
      spend();
      await deps.telegram.sendMessage(linked ? LINKED_REPLY : REJECTED_REPLY, chatId);
    } catch {
      logEvent('telegram', 'link_reply_failed'); // the link itself is done; the person sees it in the CRM
    }
  }
  return linked ? 'linked' : 'rejected';
}
