'use client';

import { useReducer, useRef, useState } from 'react';

import { Field } from '@/components/forms/field';
import { Turnstile } from '@/components/forms/turnstile';
import { ChatBubble } from '@/components/scenes/chat-bubble';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';
import { formatEuros, generateProposal, preselectedPackOf } from '@/lib/proposal/api';
import { NEED_CHIPS, SALES_MODES, TIMELINES, impliedSales, initial, progress, reduce, toPayload } from '@/lib/proposal/machine';

import styles from './guided-chat.module.css';
import { ProposalCard } from './proposal-card';
import { SendForm } from './send-form';

import type { ProposalCardLabels } from './proposal-card';
import type { SendFormLabels } from './send-form';
import type { NeedChip, SalesMode, Timeline } from '@/lib/proposal/machine';
import type { Href, Locale, ProposalResponse } from '@josecoded/types';
import type { FormEvent } from 'react';

export interface GuidedChatLabels {
  progress: string;
  chatLabel: string;
  back: string;
  verify: string;
  generating: string;
  business: { question: string; chips: Record<'restaurant' | 'clinic' | 'shop' | 'services', string>; other: string; otherHelp: string; next: string };
  needs: { question: string; legend: string; chips: Record<NeedChip, string>; text: string; next: string };
  sales: { question: string; options: Record<SalesMode, string> };
  timeline: { question: string; options: Record<Timeline, string> };
  errors: Record<'captcha' | 'rate' | 'quota' | 'down' | 'invalid', string>;
  /** The card's labels with the placeholders already filled by the page for the generic parts. */
  card: Omit<ProposalCardLabels, 'weeks' | 'source'> & {
    weeksOne: string;
    weeksMany: string;
    sourceAi: string;
    sourceRules: string;
  };
  send: SendFormLabels;
  contact: string;
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => String(values[key] ?? whole));

/**
 * The guided proposal (plan 3.9): four short questions, then the proposal the gateway prices from the
 * published list, then a form to send it. The order of the questions lives in `lib/proposal/machine.ts`;
 * this component renders the current step and the conversation so far, asks the gateway when the
 * last answer arrives and shows what came back or why it did not. `?pack=` is sent as a hint to the
 * classifier and `?q=` fills the free business field. The Turnstile token is read from the check form
 * at the moment of asking (a token works once, so the widget is remounted after each attempt).
 *
 * A11y: the thread is a polite live region (`role="log"`); each new step takes focus on its question;
 * chips are real buttons, needs are real checkboxes; errors are `role="alert"`; «Pregunta 2 de 4» is
 * visible text.
 */
export function GuidedChat({
  locale,
  apiUrl,
  siteKey,
  pack,
  query,
  labels,
  email,
  whatsapp,
}: {
  locale: Locale;
  apiUrl: string;
  siteKey: string;
  pack?: string;
  query?: string;
  labels: GuidedChatLabels;
  email?: string;
  whatsapp?: Href;
}) {
  const labelOf = (chip: NeedChip) => labels.needs.chips[chip];
  const [state, dispatch] = useReducer(
    (current: ReturnType<typeof initial>, action: Parameters<typeof reduce>[1]) => reduce(current, action, labelOf),
    undefined,
    () => initial({ preselectedPack: pack }),
  );
  const [proposal, setProposal] = useState<ProposalResponse | null>(null);
  const [error, setError] = useState<keyof GuidedChatLabels['errors'] | null>(null);
  const [sending, setSending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const verify = useRef<HTMLFormElement>(null);
  const question = useRef<HTMLParagraphElement>(null);

  const { current, total } = progress(state);

  async function ask(next: ReturnType<typeof initial>) {
    const payload = toPayload(next, labelOf);
    if (!payload) return;
    const token = new FormData(verify.current ?? undefined).get('cf-turnstile-response');
    setError(null);
    if (typeof token !== 'string' || token === '') {
      setError('captcha');
      dispatch({ type: 'failed' });
      return;
    }
    const result = await generateProposal(apiUrl, {
      locale,
      turnstileToken: token,
      answers: payload,
      preselectedPack: preselectedPackOf(next.preselectedPack),
    });
    setAttempt((value) => value + 1);
    if (result.status === 'ok') {
      track('proposal_generated', { pack: result.proposal.pack.code, questions: result.proposal.questions.length, source: result.proposal.source });
      setProposal(result.proposal);
      dispatch({ type: 'generated' });
    } else {
      setError(result.reason);
      dispatch({ type: 'failed' });
    }
  }

  function answerTimeline(value: Timeline) {
    const next = reduce(state, { type: 'answer', step: 'timeline', value }, labelOf);
    dispatch({ type: 'answer', step: 'timeline', value });
    void ask(next);
  }

  function submitBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('other');
    if (typeof value === 'string' && value.trim() !== '') dispatch({ type: 'answer', step: 'business', value });
  }

  function submitNeeds(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const chips = data.getAll('chip').filter((chip): chip is NeedChip => NEED_CHIPS.some((known) => known === chip));
    const text = typeof data.get('text') === 'string' ? String(data.get('text')) : '';
    if (chips.length > 0 || text.trim() !== '') dispatch({ type: 'answer', step: 'needs', value: { chips, text } });
  }

  const businessChips = Object.entries(labels.business.chips) as [string, string][];
  const salesOptions = SALES_MODES.map((mode) => [mode, labels.sales.options[mode]] as const);
  const timelineOptions = TIMELINES.map((mode) => [mode, labels.timeline.options[mode]] as const);

  const thread: { id: string; from: 'author' | 'visitor'; text: string }[] = [];
  if (state.business !== undefined) {
    thread.push({ id: 'q-business', from: 'author', text: labels.business.question }, { id: 'a-business', from: 'visitor', text: state.business });
  }
  if (state.needs) {
    const text = [...state.needs.chips.map(labelOf), state.needs.text.trim()].filter(Boolean).join('; ');
    thread.push({ id: 'q-needs', from: 'author', text: labels.needs.question }, { id: 'a-needs', from: 'visitor', text });
  }
  if (state.sales && state.needs && impliedSales(state.needs.chips) === undefined) {
    thread.push({ id: 'q-sales', from: 'author', text: labels.sales.question }, { id: 'a-sales', from: 'visitor', text: labels.sales.options[state.sales] });
  }
  if (state.timeline) {
    thread.push({ id: 'q-timeline', from: 'author', text: labels.timeline.question }, { id: 'a-timeline', from: 'visitor', text: labels.timeline.options[state.timeline] });
  }

  const weeks = proposal ? fill(proposal.pack.weeks === 1 ? labels.card.weeksOne : labels.card.weeksMany, { weeks: proposal.pack.weeks }) : '';

  if (state.step === 'proposal' && proposal) {
    return (
      <div className={styles.result}>
        <ProposalCard
          proposal={proposal}
          locale={locale}
          labels={{
            ...labels.card,
            pack: fill(labels.card.pack, { code: proposal.pack.code, name: proposal.pack.name }),
            from: fill(labels.card.from, { price: formatEuros(proposal.priceFrom, locale) }),
            weeks,
            appText: fill(labels.card.appText, { price: formatEuros(proposal.priceFrom, locale), weeks }),
            source: proposal.source === 'ai' ? labels.card.sourceAi : labels.card.sourceRules,
          }}
          onSend={() => setSending(true)}
          onRestart={() => {
            setProposal(null);
            setSending(false);
            dispatch({ type: 'restart' });
          }}
        />
        {sending && proposal.proposalToken ? (
          <SendForm locale={locale} siteKey={siteKey} proposalToken={proposal.proposalToken} pack={proposal.pack.code} labels={labels.send} email={email} whatsapp={whatsapp} />
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.chat}>
      <div role="log" aria-label={labels.chatLabel} aria-live="polite" className={styles.thread}>
        {thread.map((line) => (
          <ChatBubble key={line.id} from={line.from} text={line.text} />
        ))}
      </div>

      {state.step !== 'generating' ? (
        <div className={styles.step}>
          <p className={styles.progress}>{fill(labels.progress, { current, total })}</p>
          {state.step === 'business' ? (
            <form onSubmit={submitBusiness} className={styles.form}>
              <p ref={question} className={styles.question} tabIndex={-1}>
                {labels.business.question}
              </p>
              <div className={styles.chips}>
                {businessChips.map(([id, text]) => (
                  <Button key={id} variant="ghost" onClick={() => dispatch({ type: 'answer', step: 'business', value: text })}>
                    {text}
                  </Button>
                ))}
              </div>
              <Field kind="text" name="other" label={labels.business.other} help={labels.business.otherHelp} defaultValue={query} maxLength={120} />
              <div>
                <Button type="submit">{labels.business.next}</Button>
              </div>
            </form>
          ) : null}
          {state.step === 'needs' ? (
            <form onSubmit={submitNeeds} className={styles.form}>
              <fieldset className={styles.needs}>
                <legend className={styles.question}>{labels.needs.question}</legend>
                <p className={styles.help}>{labels.needs.legend}</p>
                {NEED_CHIPS.map((chip) => (
                  <Field key={chip} kind="checkbox" name="chip" value={chip} label={labels.needs.chips[chip]} />
                ))}
              </fieldset>
              <Field kind="textarea" name="text" label={labels.needs.text} rows={3} maxLength={400} />
              <div className={styles.row}>
                <Button variant="ghost" onClick={() => dispatch({ type: 'back' })}>
                  {labels.back}
                </Button>
                <Button type="submit">{labels.needs.next}</Button>
              </div>
            </form>
          ) : null}
          {state.step === 'sales' ? (
            <div className={styles.form}>
              <p className={styles.question}>{labels.sales.question}</p>
              <div className={styles.chips}>
                {salesOptions.map(([id, text]) => (
                  <Button key={id} variant="ghost" onClick={() => dispatch({ type: 'answer', step: 'sales', value: id })}>
                    {text}
                  </Button>
                ))}
              </div>
              <div>
                <Button variant="ghost" onClick={() => dispatch({ type: 'back' })}>
                  {labels.back}
                </Button>
              </div>
            </div>
          ) : null}
          {state.step === 'timeline' ? (
            <div className={styles.form}>
              <p className={styles.question}>{labels.timeline.question}</p>
              <div className={styles.chips}>
                {timelineOptions.map(([id, text]) => (
                  <Button key={id} variant="ghost" onClick={() => answerTimeline(id)}>
                    {text}
                  </Button>
                ))}
              </div>
              <div>
                <Button variant="ghost" onClick={() => dispatch({ type: 'back' })}>
                  {labels.back}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p role="status" className={styles.question}>
          {labels.generating}
        </p>
      )}

      {error ? (
        <p role="alert" className={styles.error}>
          {labels.errors[error]}{' '}
          {(error === 'quota' || error === 'down') && (email || whatsapp) ? (
            <>
              {email ? <a href={`mailto:${email}`}>{labels.contact}</a> : null}
              {!email && whatsapp ? <a href={whatsapp}>{labels.contact}</a> : null}
            </>
          ) : null}
        </p>
      ) : null}

      <form ref={verify} className={styles.verify} aria-label={labels.verify}>
        <Turnstile key={attempt} siteKey={siteKey} action="proposal" locale={locale} />
      </form>
    </div>
  );
}
