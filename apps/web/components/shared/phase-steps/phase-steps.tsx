import { getTranslations } from 'next-intl/server';

import { PHASE_STEPS, phaseFilled, phaseSteps } from '@/lib/crm/clients';

import styles from './phase-steps.module.css';

import type { Locale, ProjectPhase } from '@josecoded/types';

/**
 * Where a project is, in the five steps of its life (kickoff, design, build, review, delivery; `maintenance` comes
 * after them). One concept, two sizes: `steps` is the line under the head of a client's file (an ordered list: the
 * step that is on is `aria-current="step"`, the ones before it are done), `mini` is the short bar of a table row with
 * the name of the phase and «3 de 5» beside it. Neither says it with colour alone: the name of the phase is always
 * written, and the bar of the `mini` is decoration.
 */
export async function PhaseSteps({
  phase,
  variant = 'steps',
  locale,
}: {
  phase: ProjectPhase;
  variant?: 'steps' | 'mini';
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'crmClients' });

  if (variant === 'mini') {
    const done = phaseFilled(phase);
    return (
      <span className={styles.mini}>
        <span className={styles.bar} aria-hidden="true">
          {PHASE_STEPS.map((key, index) => (
            <i key={key} data-done={index < done ? '' : undefined} />
          ))}
        </span>
        {t(`phase.${phase}`)}
        <span className={styles.count}>{t('phaseMini', { done, total: PHASE_STEPS.length })}</span>
      </span>
    );
  }

  return (
    <ol className={styles.steps} role="list" aria-label={t('phaseStep.label')}>
      {phaseSteps(phase).map(({ key, state }) => (
        <li key={key} data-done={state === 'done' ? '' : undefined} aria-current={state === 'current' ? 'step' : undefined}>
          {t(`phaseStep.${key}`)}
        </li>
      ))}
    </ol>
  );
}
