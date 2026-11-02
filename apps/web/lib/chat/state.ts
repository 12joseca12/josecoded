import { CHAT_CASES } from '@josecoded/types';

import type { ChatCase, ChatFailure, ChatMessageView, ChatThreadItem, ChatThreadView } from '@josecoded/types';

// The state of the live chat as a pure reducer (no React, no network), like `lib/proposal/machine.ts`: the screen
// dispatches what the gateway answered and renders `items`. Messages are plain text all the way.

export interface ChatState {
  case: ChatCase;
  /** Whose greeting opens the thread: the case it started with (a later switch does not rewrite the first line). */
  greetingCase: ChatCase;
  threadId?: string;
  items: readonly ChatThreadItem[];
  /** Jose took the thread over: the assistant is off. */
  handover: boolean;
  /** The day's limit is reached (the gateway does not report counts, only the refusal). */
  blocked: boolean;
  sending: boolean;
  /** Last failure to show; cleared by the next attempt. */
  notice?: ChatFailure;
  /** `created_at` of the newest message seen: the polling asks for what came after it. */
  cursor?: string;
}

export type ChatAction =
  | { type: 'loaded'; thread: ChatThreadView; messages: readonly ChatMessageView[] }
  | { type: 'polled'; thread: ChatThreadView; messages: readonly ChatMessageView[] }
  | { type: 'created'; threadId: string; aiEnabled: boolean }
  | { type: 'sendStarted'; localId: string; text: string }
  | { type: 'sent'; localId: string; visitor: ChatMessageView; assistant: ChatMessageView | null; aiEnabled: boolean }
  | { type: 'sendFailed'; localId: string; reason: ChatFailure }
  | { type: 'caseChosen'; case: ChatCase }
  | { type: 'caseSwitched'; thread: ChatThreadView; message: ChatMessageView | null }
  | { type: 'failed'; reason: ChatFailure }
  | { type: 'noticeCleared' };

export function initialState(chatCase: ChatCase): ChatState {
  return { case: chatCase, greetingCase: chatCase, items: [], handover: false, blocked: false, sending: false };
}

/** A gateway message as the screen draws it; `null` for the ones that are bookkeeping (the visitor's own contact record, system lines). */
export function toItems(message: ChatMessageView): ChatThreadItem[] {
  if (message.message_type === 'case_switch') {
    const to = CHAT_CASES.find((id) => `case_switch:${id}` === message.content);
    return to ? [{ id: message.id, kind: 'case_switch', to }] : [];
  }
  if (message.message_type === 'quick_contact') {
    // the assistant's invitation to leave a contact comes with the row; the visitor's `quick_contact:<channel>` record is not shown
    return message.sender_role === 'visitor'
      ? []
      : [
          { id: message.id, kind: 'message', from: message.sender_role, text: message.content },
          { id: `${message.id}:contact`, kind: 'quick_contact' },
        ];
  }
  if (message.message_type !== 'text') return [];
  return [{ id: message.id, kind: 'message', from: message.sender_role, text: message.content }];
}

function merge(items: readonly ChatThreadItem[], messages: readonly ChatMessageView[]): ChatThreadItem[] {
  const seen = new Set(items.map((item) => item.id));
  const fresh = messages.flatMap(toItems).filter((item) => !seen.has(item.id));
  return [...items, ...fresh];
}

function newest(current: string | undefined, messages: readonly ChatMessageView[]): string | undefined {
  return messages.reduce<string | undefined>((max, m) => (max === undefined || m.created_at > max ? m.created_at : max), current);
}

const taken = (thread: ChatThreadView) => !thread.ai_enabled || thread.status === 'handed_over';

export function reduce(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'loaded':
      return {
        ...state,
        case: action.thread.case,
        greetingCase: action.thread.case,
        threadId: action.thread.id,
        items: merge([], action.messages),
        handover: taken(action.thread),
        cursor: newest(undefined, action.messages),
      };
    case 'polled':
      return {
        ...state,
        items: merge(state.items, action.messages),
        handover: taken(action.thread),
        cursor: newest(state.cursor, action.messages),
      };
    case 'created':
      return { ...state, threadId: action.threadId, handover: !action.aiEnabled };
    case 'sendStarted':
      return { ...state, sending: true, notice: undefined, items: [...state.items, { id: action.localId, kind: 'message', from: 'visitor', text: action.text }] };
    case 'sent': {
      const replaced = state.items.filter((item) => item.id !== action.localId);
      return {
        ...state,
        sending: false,
        handover: !action.aiEnabled,
        items: merge(replaced, [action.visitor, ...(action.assistant ? [action.assistant] : [])]),
        cursor: newest(state.cursor, [action.visitor, ...(action.assistant ? [action.assistant] : [])]),
      };
    }
    case 'sendFailed':
      return {
        ...state,
        sending: false,
        notice: action.reason === 'quota' ? undefined : action.reason,
        blocked: state.blocked || action.reason === 'quota',
        items: state.items.filter((item) => item.id !== action.localId),
      };
    case 'caseChosen':
      return { ...state, case: action.case, ...(state.threadId ? {} : { greetingCase: action.case }) };
    case 'caseSwitched':
      return { ...state, case: action.thread.case, items: action.message ? merge(state.items, [action.message]) : state.items, cursor: newest(state.cursor, action.message ? [action.message] : []) };
    case 'failed':
      return { ...state, sending: false, notice: action.reason };
    case 'noticeCleared':
      return { ...state, notice: undefined };
  }
}
