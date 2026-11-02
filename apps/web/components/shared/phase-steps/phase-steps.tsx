import { getTranslations } from 'next-intl/server';

import { PHASE_STEPS, phaseFilled } from '@/lib/crm/clients';

import styles from './phase-steps.module.css';

import type { Locale, ProjectPhase } from '@josecoded/types';

/**
 * Where a project is, in the five steps of its life (kickoff, design, build, review, delivery; `maintenance` comes
 * after them). `mini` is the short bar of a table row with the name of the phase and «3/5» beside it; the bar is
 * decoration, the name of the phase is always written. The `steps` variant of a client's file arrives with it.
 */
export async function PhaseSteps({ phase, locale }: { phase: ProjectPhase; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'crmClients' });
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
