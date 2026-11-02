import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deliver, deliverAll, MAX_RECIPIENTS, ownerOf, RECIPIENTS_FALLBACK_TTL_MS, RECIPIENTS_TTL_MS, resetRecipientsCache, resolveRecipients } from './notifications.service';
import { createFakeClock } from '../../test/fakes/clock.fake';
import { createFakeEmail, createFakeNotices, createFakeRecipients, createFakeTelegram } from '../../test/fakes/ports.fake';

import type { Deps } from '../deps';
import type { Recipient } from '../ports';
import type { OutboxEvent } from '@josecoded/types';

const OWNER = '11111111-1111-4111-8111-111111111111';
const ADMIN_CHAT: Recipient = { channel: 'telegram', address: '1000' };
const OWNER_CHAT: Recipient = { channel: 'telegram', address: '2000' };

const ev = (event: string, payload: Record<string, unknown> = {}, attempts = 1, id = 7): OutboxEvent => ({ id, event, payload, attempts, createdAt: new Date() });

beforeEach(() => {
  resetRecipientsCache();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('resolveRecipients', () => {
  it('story.proposed reaches the admin and the owner of the contact', async () => {
    const recipients = createFakeRecipients({ 'story.proposed': [ADMIN_CHAT, OWNER_CHAT] });
    const out = await resolveRecipients({ recipients, clock: createFakeClock() }, 'story.proposed', { owner_id: OWNER });
    expect(out).toEqual([ADMIN_CHAT, OWNER_CHAT]);
    expect(recipients.lookups).toEqual([{ event: 'story.proposed', ownerId: OWNER }]);
  });

  it('without rules for the event nobody is told', async () => {
    const out = await resolveRecipients({ recipients: createFakeRecipients(), clock: createFakeClock() }, 'story.proposed', { owner_id: OWNER });
    expect(out).toEqual([]);
  });

  it('commissions are owned by the closer', () => {
    expect(ownerOf({ closer_id: OWNER })).toBe(OWNER);
    expect(ownerOf({ owner_id: 'not-a-uuid' })).toBeNull();
    expect(ownerOf({})).toBeNull();
  });

  it('system.* always tells Jose, outside the rules', async () => {
    const recipients = createFakeRecipients({});
    const out = await resolveRecipients({ recipients, clock: createFakeClock() }, 'system.outbox_dead', {});
    expect(out).toEqual([{ channel: 'telegram', address: null, adminChat: true }]);
    expect(recipients.lookups).toHaveLength(0);
  });

  it('caches five minutes per event and owner', async () => {
    const recipients = createFakeRecipients({ 'lead.created': [ADMIN_CHAT] });
    const clock = createFakeClock();
    const deps = { recipients, clock };
    await resolveRecipients(deps, 'lead.created', { owner_id: OWNER });
    await resolveRecipients(deps, 'lead.created', { owner_id: OWNER });
    expect(recipients.lookups).toHaveLength(1);
    await resolveRecipients(deps, 'lead.created', {}); // another owner: another entry
    expect(recipients.lookups).toHaveLength(2);
    clock.advance(RECIPIENTS_TTL_MS);
    await resolveRecipients(deps, 'lead.created', { owner_id: OWNER });
    expect(recipients.lookups).toHaveLength(3);
  });

  it('counts the lookup with beforeFetch only when it goes to the database', async () => {
    const recipients = createFakeRecipients({ 'lead.created': [ADMIN_CHAT] });
    const spend = vi.fn();
    const deps = { recipients, clock: createFakeClock() };
    await resolveRecipients(deps, 'lead.created', {}, { beforeFetch: spend });
    await resolveRecipients(deps, 'lead.created', {}, { beforeFetch: spend });
    expect(spend).toHaveBeenCalledTimes(1);
  });

  it("when the rules cannot be read Jose's chat is the net for thirty seconds", async () => {
    const recipients = createFakeRecipients({});
    recipients.outage = new Error('relation does not exist');
    const clock = createFakeClock();
    const deps = { recipients, clock };
    expect(await resolveRecipients(deps, 'comment.pending', {})).toEqual([{ channel: 'telegram', address: null, adminChat: true }]);
    await resolveRecipients(deps, 'comment.pending', {});
    expect(recipients.lookups).toHaveLength(1);
    recipients.outage = undefined;
    recipients.rules['comment.pending'] = [ADMIN_CHAT];
    clock.advance(RECIPIENTS_FALLBACK_TTL_MS);
    expect(await resolveRecipients(deps, 'comment.pending', {})).toEqual([ADMIN_CHAT]);
  });

  it("an admin rule with no linked chat falls back to Jose's chat; a client Telegram stays without one", async () => {
    const fallback: Recipient = { channel: 'telegram', address: null, adminChat: true };
    const recipients = createFakeRecipients({ 'lead.created': [fallback, { channel: 'telegram', address: null }] });
    const out = await resolveRecipients({ recipients, clock: createFakeClock() }, 'lead.created', {});
    expect(out).toEqual([fallback, { channel: 'telegram', address: null }]);

    const telegram = createFakeTelegram();
    const deps = { telegram, notices: createFakeNotices(), clock: createFakeClock() } as unknown as Deps;
    await deliverAll(deps, ev('lead.created'), out, 'hola', () => undefined);
    expect(telegram.calls).toEqual([{ text: 'hola', chatId: undefined }]); // undefined = TELEGRAM_ADMIN_CHAT_ID
  });

  it('drops malformed addresses, duplicates and anything over the cap', async () => {
    const many: Recipient[] = Array.from({ length: 8 }, (_, i) => ({ channel: 'telegram', address: String(100 + i) }));
    const recipients = createFakeRecipients({
      a: [{ channel: 'telegram', address: 'not-a-chat' }, { channel: 'email', address: 'bad@' }, ADMIN_CHAT, ADMIN_CHAT, { channel: 'email', address: null }],
      b: many,
    });
    const deps = { recipients, clock: createFakeClock() };
    expect(await resolveRecipients(deps, 'a', {})).toEqual([ADMIN_CHAT, { channel: 'email', address: null }]);
    expect(await resolveRecipients(deps, 'b', {})).toHaveLength(MAX_RECIPIENTS);
  });
});

describe('deliver', () => {
  const base = () => {
    const telegram = createFakeTelegram();
    const email = createFakeEmail();
    return { telegram, email, deps: { telegram, email, notices: createFakeNotices(), clock: createFakeClock() } as unknown as Deps };
  };
  const spend = vi.fn();

  it('sends Telegram to the chat the recipient linked, or to Jose for the admin chat', async () => {
    const { deps, telegram } = base();
    await deliver(deps, ev('lead.created'), OWNER_CHAT, 'hola', spend);
    await deliver(deps, ev('lead.created'), { channel: 'telegram', address: null, adminChat: true }, 'hola', spend);
    expect(telegram.calls).toEqual([{ text: 'hola', chatId: '2000' }, { text: 'hola', chatId: undefined }]);
  });

  it('does not invent a chat for a client addressed by Telegram', async () => {
    const { deps, telegram } = base();
    await deliver(deps, ev('story.decided'), { channel: 'telegram', address: null }, 'hola', spend);
    expect(telegram.calls).toEqual([]);
  });

  it('staff.invited sends the fixed email to the invited address with its role, in the payload language', async () => {
    const { deps, email } = base();
    await deliver(deps, ev('staff.invited', { email: 'carla@example.com', role: 'closer', locale: 'en' }, 1, 33), { channel: 'email', address: null }, 'ignored', spend);
    expect(email.sent).toEqual([
      { templateId: 'staff-invited', to: 'carla@example.com', locale: 'en', vars: { role: 'closer' }, idempotencyKey: expect.stringMatching(/^outbox-33-[0-9a-f]{16}$/) },
    ]);
  });

  it('the email idempotency key is per recipient: two recipients of one event never share it', async () => {
    const { deps, email } = base();
    const event = ev('staff.invited', { role: 'closer' }, 1, 40);
    await deliver(deps, event, { channel: 'email', address: 'a@example.com' }, 'x', spend);
    await deliver(deps, event, { channel: 'email', address: 'b@example.com' }, 'x', spend);
    await deliver(deps, event, { channel: 'email', address: 'a@example.com' }, 'x', spend);
    const keys = email.sent.map((m) => m.idempotencyKey);
    expect(keys[0]).toMatch(/^outbox-40-[0-9a-f]{16}$/);
    expect(keys[1]).not.toBe(keys[0]);
    expect(keys[2]).toBe(keys[0]); // the same recipient on a retry keeps its key
  });

  it('story.decided looks the client up and writes in his language', async () => {
    const { deps, email } = base();
    const contactOf = vi.fn(async () => ({ email: 'ana@example.com', locale: 'en' as const }));
    const CLIENT = '22222222-2222-4222-8222-222222222222';
    await deliver({ ...deps, clientContacts: { contactOf } }, ev('story.decided', { client_id: CLIENT, status: 'rejected' }), { channel: 'email', address: null }, '', spend);
    expect(contactOf).toHaveBeenCalledWith(CLIENT);
    expect(email.sent[0]).toMatchObject({ templateId: 'story-decided', to: 'ana@example.com', locale: 'en', vars: { status: 'rejected' } });
  });

  it('an event with no template never produces an email, whatever a rule says', async () => {
    const { deps, email } = base();
    await deliver(deps, ev('commission.paid', { email: 'x@y.co' }), { channel: 'email', address: 'jose@example.com' }, 'x', spend);
    expect(email.sent).toEqual([]);
  });

  it('fails loudly when email is needed and not configured, instead of dropping the invitation', async () => {
    const { deps } = base();
    await expect(deliver({ ...deps, email: undefined }, ev('client.invited', { email: 'a@b.co' }), { channel: 'email', address: null }, '', spend)).rejects.toThrow('email_not_configured');
  });

  it('passes free text from the payload nowhere: enum variables only', async () => {
    const { deps, email } = base();
    await deliver(deps, ev('story.decided', { email: 'a@b.co', status: '<b>hola</b>' }), { channel: 'email', address: null }, '', spend);
    expect(email.sent[0]?.vars).toEqual({ status: 'accepted' });
  });
});

describe('deliverAll (idempotency)', () => {
  const setup = () => {
    const telegram = createFakeTelegram();
    const notices = createFakeNotices();
    const deps = { telegram, notices, clock: createFakeClock() } as unknown as Deps;
    return { telegram, notices, deps };
  };
  const spend = () => undefined;

  it('sends to every recipient', async () => {
    const { deps, telegram } = setup();
    await deliverAll(deps, ev('lead.created'), [ADMIN_CHAT, OWNER_CHAT], 'hola', spend);
    expect(telegram.calls.map((c) => c.chatId)).toEqual(['1000', '2000']);
  });

  it('when the second fails, marks the first so the retry does not repeat it, and fails the event', async () => {
    const { deps, telegram, notices } = setup();
    telegram.failChats = new Set(['2000']);
    await expect(deliverAll(deps, ev('lead.created', {}, 1), [ADMIN_CHAT, OWNER_CHAT], 'hola', spend)).rejects.toThrow('telegram down');
    expect(notices.sent.size).toBe(1);

    telegram.failChats = undefined;
    await deliverAll(deps, ev('lead.created', {}, 2), [ADMIN_CHAT, OWNER_CHAT], 'hola', spend);
    expect(telegram.calls.map((c) => c.chatId)).toEqual(['1000', '2000']); // 1000 once, 2000 on the retry
  });

  it('a single recipient costs no ledger calls at all', async () => {
    const { deps, notices } = setup();
    const wasSent = vi.spyOn(notices, 'wasSent');
    const markSent = vi.spyOn(notices, 'markSent');
    await deliverAll(deps, ev('lead.created', {}, 3), [ADMIN_CHAT], 'hola', spend);
    expect(wasSent).not.toHaveBeenCalled();
    expect(markSent).not.toHaveBeenCalled();
  });

  it('nobody to tell is a success', async () => {
    const { deps, telegram } = setup();
    await deliverAll(deps, ev('lead.created'), [], 'hola', spend);
    expect(telegram.calls).toEqual([]);
  });
});
