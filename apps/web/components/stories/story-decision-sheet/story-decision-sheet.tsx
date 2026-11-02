'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Sheet } from '@/components/crm/sheet';
import { Button } from '@/components/ui/button';
import { focusWhenGone } from '@/lib/a11y';

import { ConvertForm, DecideForm } from './story-decision-forms';

import type { Choice } from './story-decision-forms';
import type { Locale } from '@josecoded/types';

/** What the sheet needs to know about a story: plain data, already translated where it is text. */
export interface StoryDecisionTarget {
  id: string;
  title: string;
  /** The client and the story in a sentence («Ana Ruiz, Panadería La Espiga. Como …, quiero …, para …. 4 criterios.»). */
  summary: string;
  /** Who it is for, for the task the conversion creates. */
  client: string;
}

const FIRST: Choice = { decision: 'accept', createTask: true };

/**
 * The button of a story that lets the staff decide it, and the sheet it opens. `decide` is for a proposed story:
 * accept (hours, optional amount and note, «crear tarea» on by default) or reject (a reason the client will read), in
 * one sheet; `convert` is for an accepted one, a small confirmation. Wrap it in a provider that has
 * `crmClients.stories`.
 *
 * Focus: the native dialog traps it and gives it back to the button that opened it; after a save that button is gone
 * (the story has a new status), so the focus goes to the card, whose new status is then read. The result is announced
 * by the polite status of the `Sheet` («Historia aceptada y tarea creada»).
 */
export function StoryDecisionSheet({ mode, story, locale }: { mode: 'decide' | 'convert'; story: StoryDecisionTarget; locale: Locale }) {
  const t = useTranslations('crmClients.stories');
  const [open, setOpen] = useState<{ opener: Element | null } | null>(null);
  const [choice, setChoice] = useState<Choice>(FIRST);
  const decide = mode === 'decide';

  const savedMessage = decide
    ? choice.decision === 'reject'
      ? t('decideSheet.savedRejected')
      : choice.createTask
        ? t('decideSheet.savedAcceptedTask')
        : t('decideSheet.savedAccepted')
    : t('convertSheet.saved');
  const onSaved = () => focusWhenGone(open?.opener ?? null, `story-${story.id}`);

  return (
    <>
      <Button
        variant={decide ? 'solid' : 'ghost'}
        size={decide ? 'md' : 'sm'}
        icon={decide ? undefined : 'list-checks'}
        aria-haspopup="dialog"
        aria-label={decide ? t('decideFor', { title: story.title }) : t('convertFor', { title: story.title })}
        onClick={() => {
          setChoice(FIRST);
          setOpen({ opener: document.activeElement });
        }}
      >
        {decide ? t('decide') : t('convert')}
      </Button>
      <Sheet
        open={open !== null}
        onClose={() => setOpen(null)}
        variant={decide ? 'side' : 'dialog'}
        title={decide ? t('decideSheet.title') : t('convertSheet.title')}
        description={
          decide
            ? t.rich('decideSheet.description', { title: story.title, summary: story.summary, strong: (chunks) => <strong>{chunks}</strong> })
            : t('convertSheet.note', { title: story.title, client: story.client })
        }
        closeLabel={t('decideSheet.close')}
        savedMessage={savedMessage}
      >
        {decide ? (
          <DecideForm storyId={story.id} locale={locale} choice={choice} onChoice={setChoice} onSaved={onSaved} />
        ) : (
          <ConvertForm storyId={story.id} locale={locale} onSaved={onSaved} />
        )}
      </Sheet>
    </>
  );
}
