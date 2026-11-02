'use client';

import { CaseSelector } from '@/components/chat/case-selector';
import { ChatComposer } from '@/components/chat/chat-composer';
import { ChatThread } from '@/components/chat/chat-thread';
import { HandoverBand } from '@/components/chat/handover-band';
import { QuotaNotice } from '@/components/chat/quota-notice';
import { SaveThreadHint } from '@/components/chat/save-thread-hint';
import { QuickContact } from '@/components/shared/quick-contact';
import { Surface } from '@/components/ui/surface';

import styles from './chat-screen.module.css';

import type { ChatComposerLabels } from '@/components/chat/chat-composer';
import type { QuickContactLabels } from '@/components/shared/quick-contact';
import type { ChatCase, ChatContact, ChatViewData, Href } from '@josecoded/types';
import type { ReactNode } from 'react';

/** Every text of the screen, already translated (the server `ChatView` builds it; the client never reads `messages`). */
export interface ChatScreenLabels {
  cases: Record<ChatCase, string>;
  casesLabel: string;
  thread: { label: string; visitor: string; assistant: string; jose: string; caseSwitch: string };
  composer: Omit<ChatComposerLabels, 'note'> & { noteAi: string; noteJose: string };
  quota: { title: string; text: string };
  save: { text: string; action: string };
  handover: { title: string; text: string };
  quick: QuickContactLabels;
}

/** What the live chat adds to the static screen. Without it (fixtures) the case links navigate and the composer discards. */
export interface ChatLiveSlots {
  onSend: (text: string) => void;
  onCase: (id: ChatCase) => void;
  /** Already translated failure under the thread (`role="alert"`). */
  notice?: string;
  /** Before the first message: the bot check. */
  check?: ReactNode;
  /** Under the row of ways to reach Jose: leave an email or phone. */
  leave?: ReactNode;
}

/**
 * `/chat` painted from `data` (see `ChatView`): the fixtures screen and the live chat share it. The state is
 * derived from `data`: no visitor line yet → full selector; limit reached (and Jose not in) → `QuotaNotice`
 * instead of the composer; Jose in → `HandoverBand` and a composer whose note says who answers.
 */
export function ChatScreen({
  data,
  contact,
  labels,
  live,
}: {
  data: ChatViewData;
  contact: ChatContact;
  labels: ChatScreenLabels;
  live?: ChatLiveSlots;
}) {
  const started = data.thread.some((item) => item.kind === 'message' && item.from === 'visitor');
  const blocked = data.quota.used >= data.quota.limit && !data.handover;
  const quick = (
    <>
      <QuickContact
        page="chat"
        whatsapp={contact.whatsapp}
        book={contact.book}
        email={contact.email}
        linkedin={contact.linkedin}
        labels={labels.quick}
      />
      {live?.leave}
    </>
  );

  return (
    <div className={styles.stage}>
      <CaseSelector
        label={labels.casesLabel}
        labels={labels.cases}
        current={data.case}
        hrefFor={(id) => `/chat?case=${id}` as Href}
        variant={started ? 'compact' : 'full'}
        onSelect={live?.onCase}
      />
      <div className={styles.column}>
        {data.handover ? <HandoverBand title={labels.handover.title} text={labels.handover.text} /> : null}
        <Surface as="section" aria-label={labels.thread.label}>
          <ChatThread
            items={data.thread}
            label={labels.thread.label}
            senders={labels.thread}
            caseSwitch={(to) => labels.thread.caseSwitch.replace('{case}', labels.cases[to])}
            quickContact={quick}
          />
        </Surface>
        {live?.notice ? (
          <p className={styles.notice} role="alert">
            {live.notice}
          </p>
        ) : null}
        {blocked ? (
          <QuotaNotice title={labels.quota.title} text={labels.quota.text}>
            {quick}
          </QuotaNotice>
        ) : (
          <div className={styles.dock}>
            {live?.check}
            <ChatComposer
              onSend={live?.onSend}
              labels={{ ...labels.composer, note: data.handover ? labels.composer.noteJose : labels.composer.noteAi }}
            />
          </div>
        )}
        {started && !data.signedIn ? (
          <SaveThreadHint text={labels.save.text} action={labels.save.action} href="/auth/login?next=/chat" />
        ) : null}
      </div>
    </div>
  );
}
