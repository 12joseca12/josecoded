'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { importContacts, previewImport } from '@/app/[locale]/(staff)/crm/importar/actions';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { assignColumn } from '@/lib/crm/import-mapping';

import { ColumnMapper } from './column-mapper';
import { CsvDropzone } from './csv-dropzone';
import { ImportPreview } from './import-preview';
import styles from './import-wizard.module.css';

import type { PickedFile } from './csv-dropzone';
import type { ImportAnalysis } from '@/lib/crm/import-analysis';
import type { ImportField } from '@/lib/crm/import-mapping';
import type { ImportDone, ImportErrorKey } from '@/lib/crm/import-types';
import type { Locale } from '@josecoded/types';
import type { FormEvent } from 'react';

/** Where the wizard starts: the dev previews open it on a later step with fixtures; the page always starts at the file. */
export interface WizardInitial {
  step: 1 | 2 | 3;
  fileName?: string;
  text?: string;
  analysis?: ImportAnalysis;
  result?: ImportDone;
}

type Busy = 'previewing' | 'importing' | null;
type Problem = ImportErrorKey | 'unreadable' | 'nothing';

/**
 * K4, the three steps in one page: file, columns with preview, result. The state lives in the browser (no library:
 * it is a handful of values) and every step that matters is decided by a Server Action, which parses the text again
 * and validates what it is given: the preview of step 2 and the import of step 3 never take the browser's word.
 * It is not a `Form`: the payload is the text of a file (up to 1 MB), not a field.
 *
 * A11y: the steps are an ordered list with `aria-current="step"`; each step's heading takes focus when it opens;
 * a polite live region says what is happening (reading, checking, importing) and the result is a status; errors
 * are an alert that takes focus.
 */
export function ImportWizard({ locale, initial }: { locale: Locale; initial?: WizardInitial }) {
  const t = useTranslations('crm.import');
  const format = useFormatter();
  const [step, setStep] = useState<1 | 2 | 3>(initial?.step ?? 1);
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [text, setText] = useState(initial?.text ?? '');
  const [fileName, setFileName] = useState(initial?.fileName ?? '');
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(initial?.analysis ?? null);
  const [result, setResult] = useState<ImportDone | null>(initial?.result ?? null);
  const [busy, setBusy] = useState<Busy>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const alert = useRef<HTMLParagraphElement>(null);
  const request = useRef(0);
  const mounted = useRef(false);

  // each step's heading takes the focus when it opens (not on first render: the page is not a step change)
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step]);
  useEffect(() => {
    if (problem) alert.current?.focus();
  }, [problem]);

  const size = (bytes: number) =>
    format.number(Math.max(1, Math.round(bytes / 1024)), { style: 'unit', unit: 'kilobyte' });

  async function analyze(source: string, name: string, mapping: ImportAnalysis['mapping'] | null) {
    const mine = ++request.current;
    setBusy('previewing');
    const out = await previewImport({ locale, text: source, mapping });
    if (mine !== request.current) return;
    setBusy(null);
    if (out.status === 'error') {
      setProblem(out.error);
      return;
    }
    setProblem(null);
    setText(source);
    setFileName(name);
    setAnalysis(out.analysis);
    setStep(2);
  }

  async function onReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pasted = String(new FormData(event.currentTarget).get('csv_text') ?? '');
    const source =
      pasted.trim() !== ''
        ? { text: pasted, name: t('file.pastedName') }
        : picked
          ? { text: picked.text, name: picked.name }
          : null;
    if (!source) {
      setProblem('nothing');
      return;
    }
    await analyze(source.text, source.name, null);
  }

  function onMap(column: number, field: ImportField | null) {
    if (!analysis) return;
    const mapping = assignColumn(analysis.mapping, column, field);
    // the selects answer at once; the server recounts the rows with the new mapping
    setAnalysis({ ...analysis, mapping });
    void analyze(text, fileName, mapping);
  }

  async function onImport() {
    if (!analysis) return;
    setBusy('importing');
    setProblem(null);
    const out = await importContacts({ locale, text, mapping: analysis.mapping, fileName });
    setBusy(null);
    if (out.status === 'error') {
      setProblem(out.error);
      return;
    }
    setResult(out.result);
    setStep(3);
  }

  function restart() {
    setPicked(null);
    setText('');
    setFileName('');
    setAnalysis(null);
    setResult(null);
    setProblem(null);
    setStep(1);
  }

  const progress =
    busy === 'previewing'
      ? t('progress.previewing')
      : busy === 'importing'
        ? t('progress.importing', { count: analysis?.valid ?? 0 })
        : '';
  const canImport =
    analysis !== null &&
    analysis.valid > 0 &&
    analysis.mapping.display_name !== undefined &&
    busy === null;
  const steps = ['file', 'columns', 'result'] as const;

  const problemAlert = problem ? (
    <p ref={alert} className={styles.alert} role="alert" tabIndex={-1}>
      <Icon name="triangle-alert" />
      <span>
        {problem === 'nothing'
          ? t('file.nothing')
          : problem === 'unreadable'
            ? t('file.unreadable')
            : t(`errors.${problem}`)}
      </span>
    </p>
  ) : null;

  return (
    <div className={styles.wizard}>
      <ol className={styles.steps} role="list" aria-label={t('steps.label')}>
        {steps.map((name, index) => (
          <li
            key={name}
            aria-current={step === index + 1 ? 'step' : undefined}
            data-done={step > index + 1 ? '' : undefined}
          >
            <span>{t(`steps.${name}`)}</span>
            {step > index + 1 ? <span className="sr-only">{t('steps.done')}</span> : null}
          </li>
        ))}
      </ol>
      {/* always in the DOM, so the screen reader has the region before the message arrives */}
      <p className="sr-only" role="status">
        {progress}
      </p>

      {step === 1 ? (
        <form
          className={styles.panel}
          onSubmit={(event) => void onReview(event)}
          noValidate
          aria-busy={busy !== null || undefined}
        >
          <h2 ref={heading} className={styles.heading} tabIndex={-1}>
            {t('file.title')}
          </h2>
          <CsvDropzone
            picked={picked}
            disabled={busy !== null}
            onPick={(file) => {
              setProblem(null);
              setPicked(file);
            }}
            onProblem={setProblem}
          />
          {problemAlert}
          <div className={styles.actions}>
            <Button
              type="submit"
              variant="solid"
              iconAfter="arrow-right"
              aria-disabled={busy !== null || undefined}
            >
              {t('file.review')}
            </Button>
          </div>
        </form>
      ) : null}

      {step === 2 && analysis ? (
        <section
          className={styles.panel}
          aria-labelledby="import-step-2"
          aria-busy={busy !== null || undefined}
        >
          <h2 id="import-step-2" ref={heading} className={styles.heading} tabIndex={-1}>
            {t('columns.title')}
          </h2>
          <div className={styles.pill}>
            <Icon name="file-text" />
            <strong>{fileName}</strong>
            <span className={styles.pillMeta}>
              {t('columns.pill', {
                rows: analysis.total,
                separator: analysis.separator,
                size: size(analysis.bytes),
              })}
            </span>
            <span className={styles.pillAction}>
              <Button variant="quiet" size="sm" onClick={restart}>
                {t('columns.change')}
              </Button>
            </span>
          </div>
          <ColumnMapper
            headers={analysis.headers}
            samples={analysis.samples}
            mapping={analysis.mapping}
            onChange={onMap}
          />
          {analysis.mapping.display_name === undefined ? (
            <p className={styles.alert} role="note">
              <Icon name="triangle-alert" />
              <span>{t('columns.nameMissing')}</span>
            </p>
          ) : null}
          <ImportPreview analysis={analysis} />
          {problemAlert}
          {analysis.valid === 0 && analysis.mapping.display_name !== undefined ? (
            <p className={styles.alert} role="note">
              <Icon name="triangle-alert" />
              <span>{t('preview.noneValid')}</span>
            </p>
          ) : null}
          <div className={styles.actions}>
            <Button variant="quiet" onClick={restart}>
              {t('preview.back')}
            </Button>
            <Button
              variant="solid"
              icon="upload"
              aria-disabled={!canImport || undefined}
              onClick={() => (canImport ? void onImport() : undefined)}
            >
              {t('preview.submit', { count: analysis.valid })}
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 && result ? (
        <section className={styles.panel} aria-labelledby="import-step-3">
          <h2 id="import-step-3" ref={heading} className={styles.heading} tabIndex={-1}>
            {t('result.title')}
          </h2>
          <div className={styles.result} role="status">
            <p className={styles.resultLine}>
              <span className={styles.figure}>
                {t('result.created', { count: result.created })}
              </span>
              <span className={styles.figure}>
                {t('result.updated', { count: result.updated })}
              </span>
              <span className={styles.figure}>
                {t('result.invalid', { count: result.skipped })}
              </span>
              {result.conflicts > 0 ? (
                <span className={`${styles.figure} ${styles.pending}`}>
                  {t('result.pending', { count: result.conflicts })}
                </span>
              ) : null}
            </p>
            {result.replayed ? (
              <p className={styles.resultText}>
                {result.importedAt
                  ? t('result.replayed', {
                      date: format.dateTime(new Date(result.importedAt), {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/Madrid',
                      }),
                    })
                  : t('result.replayedFallback')}
              </p>
            ) : null}
            {result.conflicts > 0 ? (
              <p className={styles.resultText}>
                {t('result.conflicts', { count: result.conflicts })}
              </p>
            ) : null}
            <div className={styles.resultActions}>
              {result.created > 0 ? (
                <ArrowLink size="label" href={`/crm/contactos?import=${result.import_id}`}>
                  {t('result.openCreated', { count: result.created })}
                </ArrowLink>
              ) : null}
              <Button variant="quiet" size="sm" onClick={restart}>
                {t('result.another')}
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
