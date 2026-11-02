// StaffTelegramLinks over `public.staff_telegram_link(p_code, p_chat_id)` (service role, DATOS §14.4): the code was made by
// `staff_telegram_begin()` for a logged-in staff member and lives 15 minutes; this binds the chat that sent it.
import type { RawRpc } from './raw-rpc';
import type { StaffTelegramLinks } from '../ports';

export function createStaffTelegramLinks(rpc: RawRpc): StaffTelegramLinks {
  return {
    async link(code, chatId) {
      return (await rpc.call('staff_telegram_link', { p_code: code, p_chat_id: chatId })) === true;
    },
  };
}
