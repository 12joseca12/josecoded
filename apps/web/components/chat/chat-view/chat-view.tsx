import { getTranslations } from 'next-intl/server';

import { ChatLive } from '@/components/chat/chat-live';
import { ChatScreen } from '@/components/chat/chat-screen';
import { PageHead } from '@/components/shared/page-head';

import type { ChatScreenLabels } from '@/components/chat/chat-screen';
import type { ChatCase, ChatContact, ChatViewData, Locale } from '@josecoded/types';

/** What the page needs to talk to the gateway; without it the screen paints `data` as it is (fixtures, `/dev/chat`). */
export interface ChatLiveConfig {
  apiUrl: string;
  siteKey: string;
  signedIn: boolean;
  initialCase: ChatCase;
}

/**
 * `/chat` as a composition fed by props. It translates everything on the server and hands plain strings to
 * `ChatScreen` (static, from `data`) or to `ChatLive` (the thread of the gateway, B03), so the fixtures screen and the
 * real page paint the same thing.
 */
export async function ChatView({
  data,
  contact,
  locale,
  live,
}: {
  data: ChatViewData;
  contact: ChatContact;
  locale: Locale;
  live?: ChatLiveConfig;
}) {
  const t = await getTranslations({ locale, namespace: 'chat' });
  const screen: ChatScreenLabels = {
    casesLabel: t('cases.label'),
    cases: { client: t('cases.client'), partner: t('cases.partner'), recruiter: t('cases.recruiter'), curious: t('cases.curious') },
    thread: {
      label: t('thread.label'),
      visitor: t('thread.visitor'),
      assistant: t('thread.assistant'),
      jose: t('thread.jose'),
      // the case name is put in by the client: `{case}` stays in the string
      caseSwitch: t.raw('thread.caseSwitch') as string,
    },
    composer: {
      label: t('composer.label'),
      placeholder: t('composer.placeholder'),
      send: t('composer.send'),
      hintSend: t('composer.hintSend'),
      hintBreak: t('composer.hintBreak'),
      keyEnter: t('composer.keyEnter'),
      keyShift: t('composer.keyShift'),
      noteAi: t('composer.noteAi'),
      noteJose: t('composer.noteJose'),
    },
    quota: { title: t('quota.title'), text: t('quota.text') },
    save: { text: t('save.text'), action: t('save.action') },
    handover: { title: t('handover.title'), text: t('handover.text') },
    quick: {
      group: t('quick.group'),
      whatsapp: t('quick.whatsapp'),
      book: t('quick.book'),
      linkedin: t('quick.linkedin'),
      email: t('quick.email'),
      copy: t('quick.copy'),
      copied: t('quick.copied'),
      failed: t('quick.failed'),
    },
  };

  return (
    <>
      <PageHead lead={t('head.lead')} tail={t('head.accent')} />
      {live ? (
        <ChatLive
          initialCase={live.initialCase}
          locale={locale}
          apiUrl={live.apiUrl}
          siteKey={live.siteKey}
          signedIn={live.signedIn}
          contact={contact}
          labels={{
            screen,
            greeting: { client: t('greeting.client'), partner: t('greeting.partner'), recruiter: t('greeting.recruiter'), curious: t('greeting.curious') },
            notices: {
              captcha: t('notice.captcha'),
              rate: t('notice.rate'),
              closed: t('notice.closed'),
              invalid: t('notice.invalid'),
              down: t('notice.down'),
            },
            waiting: t('check.waiting'),
            leave: {
              label: t('leave.label'),
              placeholder: t('leave.placeholder'),
              submit: t('leave.submit'),
              saved: t('leave.saved'),
              invalid: t('leave.invalid'),
              failed: t('leave.failed'),
            },
          }}
        />
      ) : (
        <ChatScreen data={data} contact={contact} labels={screen} />
      )}
    </>
  );
}
