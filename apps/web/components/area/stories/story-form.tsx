'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { STORY_MAX_CRITERIA } from '@josecoded/types';

import { Field } from '@/components/forms/field';
import { Form, useFormContext } from '@/components/forms/form';
import { Button } from '@/components/ui/button';

import styles from './stories.module.css';

import type { FormState, Locale } from '@josecoded/types';

export type StoryFields = { title: string; as_a: string; i_want: string; so_that: string; criteria: string };

export type StoryAction = (previous: FormState<StoryFields>, data: FormData) => Promise<FormState<StoryFields>>;

/** Already translated by the page. `{n}`, `{count}` and `{max}` are filled in here (a function cannot cross to the client). */
export interface StoryFormLabels {
  form: string;
  title: string;
  titleHelp: string;
  asA: string;
  asHelp: string;
  iWant: string;
  wantHelp: string;
  soThat: string;
  soHelp: string;
  criteriaLegend: string;
  criteriaHelp: string;
  criterion: string;
  remove: string;
  removeShort: string;
  add: string;
  max: string;
  added: string;
  removed: string;
  submit: string;
  sent: string;
}

const fill = (template: string, values: Record<string, number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

interface Row {
  key: number;
  value: string;
}

/**
 * The story the client proposes: title, «Como…», «Quiero…», «Para…» and up to 12 acceptance criteria that she adds and
 * removes. The server action validates (`userStoryInputSchema`); the HTML limits are a convenience. The criteria
 * are plain fields with the same `name`, so the action reads them with `getAll`.
 *
 * A11y: every control has its label; the criteria are a `fieldset` with legend and help, each criterion named «Criterio
 * N» and removed by a button that says which («Quitar criterio N»); adding or removing is announced in a polite live
 * region and the focus goes to the new criterion, to the next one after a removal, or to «Añadir» when none is left;
 * errors come from `Form` (summary with focus, `aria-invalid` per field).
 */
export function StoryForm({
  action,
  locale,
  labels,
  initial,
}: {
  action: StoryAction;
  locale: Locale;
  labels: StoryFormLabels;
  initial?: { title: string; as_a: string; i_want: string; so_that: string; acceptance_criteria: readonly string[] };
}) {
  return (
    <Form action={action} submitLabel={labels.submit} label={labels.form} successMessage={labels.sent}>
      <Field kind="hidden" name="locale" value={locale} />
      <Field kind="text" name="title" label={labels.title} help={labels.titleHelp} defaultValue={initial?.title} maxLength={140} required />
      <Field kind="text" name="as_a" label={labels.asA} help={labels.asHelp} defaultValue={initial?.as_a} maxLength={200} required />
      <Field kind="textarea" name="i_want" label={labels.iWant} help={labels.wantHelp} defaultValue={initial?.i_want} rows={3} maxLength={500} required />
      <Field kind="textarea" name="so_that" label={labels.soThat} help={labels.soHelp} defaultValue={initial?.so_that} rows={3} maxLength={500} required />
      <Criteria labels={labels} initial={initial?.acceptance_criteria} />
    </Form>
  );
}

function Criteria({ labels, initial }: { labels: StoryFormLabels; initial?: readonly string[] }) {
  const form = useFormContext();
  const uid = useId();
  const start = initial?.length ? initial : ['', ''];
  const nextKey = useRef(start.length);
  const box = useRef<HTMLFieldSetElement>(null);
  const addButton = useRef<HTMLDivElement>(null);
  const focus = useRef<number | 'add' | null>(null);
  const [rows, setRows] = useState<Row[]>(() => start.map((value, key) => ({ key, value })));
  const [announcement, setAnnouncement] = useState('');
  const error = form?.state.fieldErrors?.criteria;
  const count = rows.length;
  const full = count >= STORY_MAX_CRITERIA;

  // focus after the render that changed the list: the new input, the one that took the place of the removed, or «Añadir»
  useEffect(() => {
    const target = focus.current;
    if (target === null) return;
    focus.current = null;
    if (target === 'add') addButton.current?.querySelector('button')?.focus();
    else box.current?.querySelectorAll<HTMLInputElement>('input[name="criteria"]')[target]?.focus();
  }, [rows]);

  useEffect(() => {
    if (error) box.current?.querySelector<HTMLInputElement>('input[name="criteria"]')?.focus();
  }, [error]);

  function add() {
    if (full) return;
    focus.current = count;
    setRows((previous) => [...previous, { key: nextKey.current++, value: '' }]);
    setAnnouncement(fill(labels.added, { n: count + 1, count: count + 1, max: STORY_MAX_CRITERIA }));
  }

  function remove(index: number) {
    focus.current = count === 1 ? 'add' : Math.min(index, count - 2);
    setRows((previous) => previous.filter((_, position) => position !== index));
    setAnnouncement(fill(labels.removed, { n: index + 1, count: count - 1, max: STORY_MAX_CRITERIA }));
  }

  return (
    <fieldset ref={box} className={styles.criteria} aria-describedby={`${uid}-help${error ? ` ${uid}-error` : ''}`}>
      <legend className={styles.legend}>{labels.criteriaLegend}</legend>
      <p id={`${uid}-help`} className={styles.help}>
        {fill(labels.criteriaHelp, { max: STORY_MAX_CRITERIA })}
      </p>
      {error ? (
        <p id={`${uid}-error`} className={styles.error}>
          {error}
        </p>
      ) : null}
      {rows.length > 0 ? (
        <ol className={styles.rows} role="list">
          {rows.map((row, index) => (
            <li key={row.key} className={styles.row}>
              <Field
                kind="text"
                name="criteria"
                label={fill(labels.criterion, { n: index + 1 })}
                value={row.value}
                onChange={(value) =>
                  setRows((previous) => previous.map((item) => (item.key === row.key ? { ...item, value } : item)))
                }
                maxLength={300}
                error=""
              />
              <Button variant="quiet" size="md" onClick={() => remove(index)} aria-label={fill(labels.remove, { n: index + 1 })}>
                {labels.removeShort}
              </Button>
            </li>
          ))}
        </ol>
      ) : null}
      <div ref={addButton} className={styles.add}>
        {full ? (
          <p className={styles.help}>{fill(labels.max, { max: STORY_MAX_CRITERIA })}</p>
        ) : (
          <Button variant="ghost" onClick={add}>
            {labels.add}
          </Button>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </fieldset>
  );
}
