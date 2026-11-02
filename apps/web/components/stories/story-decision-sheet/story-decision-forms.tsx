'use client';

import { useTranslations } from 'next-intl';

import { convertStory, decideStory } from '@/app/[locale]/(staff)/crm/clientes/actions';
import { CloseWhenSaved, SheetCancel, WhenSaved } from '@/components/crm/sheet';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';
import { SegmentedControl } from '@/components/scenes/segmented-control';

import styles from './story-decision-sheet.module.css';

import type { Locale } from '@josecoded/types';

/** What the person has chosen so far: the sheet announces a different result for each. */
export interface Choice {
  decision: 'accept' | 'reject';
  createTask: boolean;
}

/**
 * Aceptar (hours, optional amount and note, «crear tarea») or Rechazar (a reason), in one form: the two sets of fields
 * are always in the DOM and the one that does not apply is `hidden`, so what was typed survives a change of mind. Only
 * the visible set is `required`, and the action ignores the other. The button says what it will do and is `danger` for
 * the rejection.
 */
export function DecideForm({
  storyId,
  locale,
  choice,
  onChoice,
  onSaved,
}: {
  storyId: string;
  locale: Locale;
  choice: Choice;
  onChoice: (next: Choice) => void;
  onSaved: () => void;
}) {
  const t = useTranslations('crmClients.stories.decideSheet');
  const accept = choice.decision === 'accept';
  return (
    <Form
      action={decideStory}
      submitLabel={accept ? t('submitAccept') : t('submitReject')}
      submitVariant={accept ? 'solid' : 'danger'}
      label={t('title')}
      actions={<SheetCancel>{t('cancel')}</SheetCancel>}
    >
      <CloseWhenSaved />
      <WhenSaved onSaved={onSaved} />
      <Field kind="hidden" name="story_id" value={storyId} />
      <Field kind="hidden" name="locale" value={locale} />
      <Field kind="hidden" name="decision" value={choice.decision} />
      <SegmentedControl
        legend={t('decision')}
        options={[
          { id: 'accept', label: t('accept') },
          { id: 'reject', label: t('reject') },
        ]}
        value={choice.decision}
        onValueChange={(decision) => onChoice({ ...choice, decision: decision === 'reject' ? 'reject' : 'accept' })}
      />
      <div className={styles.panel} hidden={!accept}>
        <div className={styles.pair}>
          <Field kind="text" name="hours" label={t('hours')} inputMode="decimal" trailing={t('hoursUnit')} defaultValue="" required={accept} autoComplete="off" />
          <Field kind="text" name="amount" label={t('amount')} help={t('amountHelp')} inputMode="decimal" trailing={t('amountUnit')} autoComplete="off" />
        </div>
        <Field kind="textarea" name="note" label={t('note')} rows={3} maxLength={1000} />
        <Field
          kind="checkbox"
          name="create_task"
          label={t('createTask')}
          defaultChecked={choice.createTask}
          onChange={(createTask) => onChoice({ ...choice, createTask })}
        />
      </div>
      <div className={styles.panel} hidden={accept}>
        <Field kind="textarea" name="reason" label={t('reason')} help={t('reasonHelp')} placeholder={t('reasonPlaceholder')} rows={4} maxLength={1000} required={!accept} />
      </div>
    </Form>
  );
}

/** «Convertir en tarea»: nothing to type, only to confirm what will be created (the sheet's description says it). */
export function ConvertForm({ storyId, locale, onSaved }: { storyId: string; locale: Locale; onSaved: () => void }) {
  const t = useTranslations('crmClients.stories');
  return (
    <Form action={convertStory} submitLabel={t('convertSheet.submit')} label={t('convertSheet.title')} actions={<SheetCancel>{t('decideSheet.cancel')}</SheetCancel>}>
      <CloseWhenSaved />
      <WhenSaved onSaved={onSaved} />
      <Field kind="hidden" name="story_id" value={storyId} />
      <Field kind="hidden" name="locale" value={locale} />
    </Form>
  );
}
