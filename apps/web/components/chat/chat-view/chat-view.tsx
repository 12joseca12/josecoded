import { getTranslations } from 'next-intl/server';

import { CaseSelector } from '@/components/chat/case-selector';
import { ChatComposer } from '@/components/chat/chat-composer';
import { ChatThread } from '@/components/chat/chat-thread';
import { HandoverBand } from '@/components/chat/handover-band';
import { QuotaNotice } from '@/components/chat/quota-notice';
import { SaveThreadHint } from '@/components/chat/save-thread-hint';
import { PageHead } from '@/components/shared/page-head';
import { QuickContact } from '@/components/shared/quick-contact';
import { Surface } from '@/components/ui/surface';

import styles from './chat-view.module.css';

import type { ChatCase, ChatContact, ChatViewData, Href, Locale } from '@josecoded/types';

/**
 * `/chat` as a pure composition: it gets everything by props (`data`, the ways to contact) and fetches
 * nothing, so the fixtures screen (`/dev/chat/<state>`), the page with example data and, later, the
 * page with the real thread paint the same thing. The state is derived from `data`: no visitor line
 * yet → full selector; limit reached (and Jose not in) → `QuotaNotice` instead of the composer; Jose
 * in → `HandoverBand` and a composer whose note says who answers.
 */
export async function ChatView({
  data,
  contact,
  locale,
}: {
  data: ChatViewData;
  contact: ChatContact;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'chat' });
  const started = data.thread.some((item) => item.kind === 'message' && item.from === 'visitor');
  const blocked = data.quota.used >= data.quota.limit && !data.handover;
  const labels: Record<ChatCase, string> = {
    client: t('cases.client'),
    partner: t('cases.partner'),
    recruiter: t('cases.recruiter'),
    curious: t('cases.curious'),
  };

  const quick = (
    <QuickContact
      page="chat"
      whatsapp={contact.whatsapp}
      book={contact.book}
      email={contact.email}
      linkedin={contact.linkedin}
      labels={{
        group: t('quick.group'),
        whatsapp: t('quick.whatsapp'),
        book: t('quick.book'),
        linkedin: t('quick.linkedin'),
        email: t('quick.email'),
        copy: t('quick.copy'),
        copied: t('quick.copied'),
        failed: t('quick.failed'),
      }}
    />
  );

  return (
    <>
      <PageHead lead={t('head.lead')} tail={t('head.accent')} />
      <div className={styles.stage}>
        <CaseSelector
          label={t('cases.label')}
          labels={labels}
          current={data.case}
          hrefFor={(id) => `/chat?case=${id}` as Href}
          variant={started ? 'compact' : 'full'}
        />
        <div className={styles.column}>
          {data.handover ? <HandoverBand title={t('handover.title')} text={t('handover.text')} /> : null}
          <Surface as="section" aria-label={t('thread.label')}>
            <ChatThread
              items={data.thread}
              label={t('thread.label')}
              senders={{ visitor: t('thread.visitor'), assistant: t('thread.assistant'), jose: t('thread.jose') }}
              caseSwitch={(to) => t('thread.caseSwitch', { case: labels[to] })}
              quickContact={quick}
            />
          </Surface>
          {blocked ? (
            <QuotaNotice title={t('quota.title')} text={t('quota.text')}>
              {quick}
            </QuotaNotice>
          ) : (
            <div className={styles.dock}>
              <ChatComposer
                labels={{
                  label: t('composer.label'),
                  placeholder: t('composer.placeholder'),
                  send: t('composer.send'),
                  hintSend: t('composer.hintSend'),
                  hintBreak: t('composer.hintBreak'),
                  keyEnter: t('composer.keyEnter'),
                  keyShift: t('composer.keyShift'),
                  note: data.handover ? t('composer.noteJose') : t('composer.noteAi'),
                }}
              />
            </div>
          )}
          {started && !data.signedIn ? (
            <SaveThreadHint text={t('save.text')} action={t('save.action')} href="/auth/login?next=/chat" />
          ) : null}
        </div>
      </div>
    </>
  );
}
