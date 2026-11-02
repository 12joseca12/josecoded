// Job `telegram.poll_updates` (`*/5`, DATOS §14.6): reads the bot's pending messages and links the chats of the `/start <code>`
// ones (services/telegram-link.ts). In webhook mode (TELEGRAM_WEBHOOK_SECRET set) it does nothing: Telegram refuses
// `getUpdates` while a webhook is active. Updates are confirmed BEFORE they are processed (at most once): a failure after
// the confirmation loses one `/start`, which the person repeats, whereas processing twice would answer «invalid code» to
// someone who has just been linked. Nothing but counts is logged.
import { handleTelegramUpdate } from '../services/telegram-link';
import { logEvent } from '../utils/http-error';

import type { JobHandler } from './job';

export const TELEGRAM_POLL = 'telegram.poll_updates';

/** Worst case per `/start`: attempt counter, link RPC and reply. */
const SUBREQUESTS_PER_UPDATE = 3;
export const MAX_UPDATES = 10;

export const pollTelegramUpdates: JobHandler = async ({ env, deps, budget }) => {
  if (env.TELEGRAM_WEBHOOK_SECRET) return;
  const { telegramInbox, staffTelegram } = deps;
  if (!telegramInbox || !staffTelegram) return;
  // the poll itself, the confirmation, and then at least one update
  if (budget.remaining < 2 + SUBREQUESTS_PER_UPDATE) return;

  budget.take();
  const pending = (await telegramInbox.getUpdates(0, MAX_UPDATES)).sort((a, b) => a.update_id - b.update_id);
  if (pending.length === 0) return;

  // as many as fit in what is left, keeping one call for the confirmation
  const fit = Math.max(1, Math.floor((budget.remaining - 1) / SUBREQUESTS_PER_UPDATE));
  const batch = pending.slice(0, fit);
  budget.take();
  await telegramInbox.getUpdates(batch[batch.length - 1]!.update_id + 1, 1);

  const outcomes: Record<string, number> = {};
  for (const update of batch) {
    try {
      const outcome = await handleTelegramUpdate(deps, update, () => budget.take());
      outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
    } catch (error) {
      if (error instanceof Error && error.name === 'BudgetExhaustedError') break;
      logEvent('telegram', 'update_failed');
    }
  }
  logEvent('telegram', 'poll_done', { updates: batch.length, ...outcomes });
};
