// RecipientsRepo over `public.notification_recipients(p_event, p_owner_id)` (service role; DATOS §14.4). The function returns the
// channel and address of every active rule of the event; this adapter only validates the shape.
import { z } from 'zod';

import type { RawRpc } from './raw-rpc';
import type { Recipient, RecipientsRepo } from '../ports';

const rowsSchema = z.array(
  z.object({ channel: z.enum(['telegram', 'email']), address: z.string().max(320).nullable(), admin_fallback: z.boolean().optional() }),
);

export function createRecipientsRepo(rpc: RawRpc): RecipientsRepo {
  return {
    async forEvent(event, ownerId) {
      const rows = rowsSchema.parse((await rpc.call('notification_recipients', { p_event: event, p_owner_id: ownerId })) ?? []);
      return rows.map(
        (r): Recipient =>
          r.admin_fallback === true && r.channel === 'telegram' && r.address === null
            ? { channel: 'telegram', address: null, adminChat: true } // an admin without a linked chat: Jose's own (TELEGRAM_ADMIN_CHAT_ID)
            : { channel: r.channel, address: r.address },
      );
    },
  };
}
