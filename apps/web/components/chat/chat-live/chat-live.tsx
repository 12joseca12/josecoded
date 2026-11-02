'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { quickContactRequestSchema } from '@josecoded/types';

import { ChatScreen } from '@/components/chat/chat-screen';
import { LeaveContact } from '@/components/chat/leave-contact';
import { Turnstile } from '@/components/forms/turnstile';
import { track } from '@/lib/analytics';
import { createChatApi } from '@/lib/chat/api';
import { initialState, reduce } from '@/lib/chat/state';
import { accessToken } from '@/lib/chat/token';
import { usePolling } from '@/lib/chat/use-polling';

import styles from './chat-live.module.css';

import type { ChatScreenLabels } from '@/components/chat/chat-screen';
import type { LeaveContactLabels, LeaveContactResult } from '@/components/chat/leave-contact';
import type { ChatCase, ChatContact, ChatFailure, ChatViewData, Locale } from '@josecoded/types';

const POLL_MS = 6000;

export interface ChatLiveLabels {
  screen: ChatScreenLabels;
  greeting: Record<ChatCase, string>;
  /** One sentence per failure the visitor can act on; the rest share `down`. */
  notices: Record<'captcha' | 'rate' | 'closed' | 'invalid' | 'down', string>;
  waiting: string;
  leave: LeaveContactLabels;
}

/**
 * `/chat` against the gateway. The first message creates the thread (Turnstile `chat`, the gateway sets the HttpOnly
 * `__Host-chat_sid` cookie), later ones are posted to it; while the tab is visible the thread is polled for what Jose
 * (or the assistant) wrote meanwhile. Changing the case after the thread exists tells the gateway; a signed-in
 * visitor's thread is claimed once. Failures become one `role="alert"` sentence; the daily limit becomes `QuotaNotice`.
 */
export function ChatLive({
  initialCase,
  locale,
  apiUrl,
  siteKey,
  signedIn,
  contact,
  labels,
}: {
  initialCase: ChatCase;
  locale: Locale;
  apiUrl: string;
  siteKey: string;
  signedIn: boolean;
  contact: ChatContact;
  labels: ChatLiveLabels;
}) {
  const api = useMemo(() => createChatApi({ apiUrl, ...(signedIn ? { getToken: accessToken } : {}) }), [apiUrl, signedIn]);
  const [state, dispatch] = useReducer(reduce, initialCase, initialState);
  const [attempt, setAttempt] = useState(0);
  const token = useRef<{ value?: string; waiters: ((value: string) => void)[] }>({ waiters: [] });
  const counter = useRef(0);
  const claimed = useRef(false);

  // the thread of this browser (cookie) or of the signed-in user, if there is one
  useEffect(() => {
    let live = true;
    void api.current().then((result) => {
      if (live && result.status === 'ok') dispatch({ type: 'loaded', ...result.data });
    });
    return () => {
      live = false;
    };
  }, [api]);

  // «Entra para guardar»: once logged in, the visitor's thread becomes the account's (idempotent; another account's is ignored)
  useEffect(() => {
    if (!signedIn || !state.threadId || claimed.current) return;
    claimed.current = true;
    void api.claim(state.threadId);
  }, [api, signedIn, state.threadId]);

  usePolling(
    async () => {
      const result = await api.current(state.cursor);
      if (result.status === 'ok') dispatch({ type: 'polled', ...result.data });
    },
    { intervalMs: POLL_MS, enabled: state.threadId !== undefined && !state.sending },
  );

  const onToken = (value: string | null) => {
    token.current.value = value ?? undefined;
    if (value) token.current.waiters.splice(0).forEach((resolve) => resolve(value));
  };
  const waitForToken = () =>
    token.current.value ? Promise.resolve(token.current.value) : new Promise<string>((resolve) => token.current.waiters.push(resolve));

  const send = async (text: string) => {
    if (state.sending || state.blocked) return;
    const localId = `local-${counter.current++}`;
    dispatch({ type: 'sendStarted', localId, text });
    let threadId = state.threadId;
    if (!threadId) {
      const turnstileToken = await waitForToken();
      const created = await api.createThread({ case: state.case, locale, originPath: '/chat', turnstileToken });
      token.current.value = undefined; // single use
      if (created.status === 'error') {
        setAttempt((n) => n + 1);
        dispatch({ type: 'sendFailed', localId, reason: created.reason });
        return;
      }
      threadId = created.data.threadId;
      dispatch({ type: 'created', threadId, aiEnabled: created.data.aiEnabled });
      track('chat_started');
    }
    const sent = await api.send(threadId, text);
    if (sent.status === 'error') {
      dispatch({ type: 'sendFailed', localId, reason: sent.reason });
      return;
    }
    dispatch({ type: 'sent', localId, ...sent.data });
  };

  const chooseCase = async (id: ChatCase) => {
    if (id === state.case) return;
    try {
      window.history.replaceState(null, '', `?case=${id}`);
    } catch {
      // the address is a nicety
    }
    if (!state.threadId) {
      dispatch({ type: 'caseChosen', case: id });
      return;
    }
    const result = await api.switchCase(state.threadId, id);
    dispatch(result.status === 'ok' ? { type: 'caseSwitched', ...result.data } : { type: 'failed', reason: result.reason });
  };

  const leaveContact = async (value: string): Promise<LeaveContactResult> => {
    if (!state.threadId) return 'failed';
    const parsed = quickContactRequestSchema.safeParse(value.includes('@') ? { channel: 'email', email: value } : { channel: 'phone', phone: value });
    if (!parsed.success) return 'invalid';
    const result = await api.quickContact(state.threadId, parsed.data);
    if (result.status === 'ok') track('contact_submit', { via: 'chat' });
    return result.status === 'ok' ? 'saved' : 'failed';
  };

  const noticeOf = (reason: ChatFailure | undefined) => {
    if (!reason) return undefined;
    return reason === 'captcha' || reason === 'rate' || reason === 'closed' || reason === 'invalid' ? labels.notices[reason] : labels.notices.down;
  };

  const data: ChatViewData = {
    case: state.case,
    thread: [{ id: 'greeting', kind: 'message', from: 'assistant', text: labels.greeting[state.greetingCase] }, ...state.items],
    quota: { used: state.blocked ? 1 : 0, limit: 1 },
    handover: state.handover,
    signedIn,
  };

  return (
    <ChatScreen
      data={data}
      contact={contact}
      labels={labels.screen}
      live={{
        onSend: (text) => void send(text),
        onCase: (id) => void chooseCase(id),
        notice: noticeOf(state.notice),
        leave: state.threadId ? <LeaveContact labels={labels.leave} onSubmit={leaveContact} /> : undefined,
        check: state.threadId ? undefined : (
          <div className={styles.check}>
            <Turnstile key={attempt} siteKey={siteKey} action="chat" locale={locale} onToken={onToken} />
            {state.sending ? (
              <p className={styles.waiting} role="status">
                {labels.waiting}
              </p>
            ) : null}
          </div>
        ),
      }}
    />
  );
}
