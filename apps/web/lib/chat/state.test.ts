import { describe, expect, it } from 'vitest';

import { initialState, reduce, toItems } from './state';

import type { ChatMessageView, ChatThreadView } from '@josecoded/types';

const msg = (n: number, over: Partial<ChatMessageView> = {}): ChatMessageView => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  sender_role: 'assistant',
  content: `m${n}`,
  message_type: 'text',
  created_at: `2026-11-02T10:00:0${n}.000Z`,
  ...over,
});
const thread = (over: Partial<ChatThreadView> = {}): ChatThreadView => ({
  id: '00000000-0000-4000-8000-0000000000aa',
  case: 'client',
  locale: 'es',
  status: 'open',
  ai_enabled: true,
  context_version: 1,
  ...over,
});

describe('toItems', () => {
  it('draws text, hides the visitor contact record and adds the contact row after the assistant invitation', () => {
    expect(toItems(msg(1))).toEqual([{ id: msg(1).id, kind: 'message', from: 'assistant', text: 'm1' }]);
    expect(toItems(msg(2, { sender_role: 'visitor', message_type: 'quick_contact', content: 'quick_contact:email' }))).toEqual([]);
    expect(toItems(msg(3, { message_type: 'quick_contact' })).map((i) => i.kind)).toEqual(['message', 'quick_contact']);
    expect(toItems(msg(4, { message_type: 'system' }))).toEqual([]);
  });

  it('reads the target case of a case switch and ignores an unknown one', () => {
    expect(toItems(msg(5, { message_type: 'case_switch', content: 'case_switch:partner' }))).toEqual([{ id: msg(5).id, kind: 'case_switch', to: 'partner' }]);
    expect(toItems(msg(6, { message_type: 'case_switch', content: 'case_switch:nope' }))).toEqual([]);
  });
});

describe('chat reducer', () => {
  it('loads a thread, then merges polled messages without repeating and flags the handover', () => {
    let s = reduce(initialState('client'), { type: 'loaded', thread: thread({ case: 'partner' }), messages: [msg(1)] });
    expect(s).toMatchObject({ case: 'partner', greetingCase: 'partner', threadId: thread().id, handover: false, cursor: msg(1).created_at });
    s = reduce(s, { type: 'polled', thread: thread({ ai_enabled: false, status: 'handed_over' }), messages: [msg(1), msg(2, { sender_role: 'jose' })] });
    expect(s.items.map((i) => i.id)).toEqual([msg(1).id, msg(2).id]);
    expect(s).toMatchObject({ handover: true, cursor: msg(2).created_at });
  });

  it('shows the message at once and swaps it for the saved ones when sent', () => {
    let s = reduce(initialState('client'), { type: 'sendStarted', localId: 'local-0', text: 'hola' });
    expect(s).toMatchObject({ sending: true, items: [{ id: 'local-0', from: 'visitor', text: 'hola' }] });
    s = reduce(s, { type: 'sent', localId: 'local-0', visitor: msg(1, { sender_role: 'visitor' }), assistant: msg(2), aiEnabled: true });
    expect(s.sending).toBe(false);
    expect(s.items.map((i) => i.id)).toEqual([msg(1).id, msg(2).id]);
  });

  it('takes the message back on a failure; the quota blocks instead of warning', () => {
    const started = reduce(initialState('client'), { type: 'sendStarted', localId: 'local-0', text: 'hola' });
    const failed = reduce(started, { type: 'sendFailed', localId: 'local-0', reason: 'down' });
    expect(failed).toMatchObject({ items: [], notice: 'down', blocked: false, sending: false });
    const quota = reduce(started, { type: 'sendFailed', localId: 'local-0', reason: 'quota' });
    expect(quota).toMatchObject({ blocked: true, notice: undefined });
    expect(reduce(failed, { type: 'noticeCleared' }).notice).toBeUndefined();
  });

  it('changes the case before a thread without touching the greeting of a started one', () => {
    const fresh = reduce(initialState('client'), { type: 'caseChosen', case: 'recruiter' });
    expect(fresh).toMatchObject({ case: 'recruiter', greetingCase: 'recruiter' });
    const started = reduce(fresh, { type: 'loaded', thread: thread({ case: 'recruiter' }), messages: [] });
    const switched = reduce(started, { type: 'caseSwitched', thread: thread({ case: 'curious' }), message: msg(1, { message_type: 'case_switch', content: 'case_switch:curious' }) });
    expect(switched).toMatchObject({ case: 'curious', greetingCase: 'recruiter' });
    expect(switched.items).toEqual([{ id: msg(1).id, kind: 'case_switch', to: 'curious' }]);
  });
});
