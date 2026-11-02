import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';

import { TabNav } from '@/components/crm/tab-nav';
import { PageHead } from '@/components/staff/page-head';

import { ConflictQueue } from './conflict-queue';
import { ImportHistory } from './import-history';
import { ImportWizard } from './import-wizard';

import type { WizardInitial } from './import-wizard';
import type { StaffRole } from '@/lib/auth/staff';
import type { ConflictQueueData, ImportRecord, OwnConflict } from '@/lib/crm/import-types';
import type { Locale } from '@josecoded/types';

export type ImportTab = 'importar' | 'conflictos';

/**
 * K4 as a view of already-read data: the page fetches (RLS decides what exists for the person) and the dev previews
 * feed it fixtures. The admin has two tabs, the closer none: «Conflictos» does not exist for her, and the queue is
 * only given to this view by a page that passed `requireAdmin()`. Only the sentences of K4 travel to the browser.
 */
export async function ImportView({
  locale,
  role,
  tab,
  imports,
  own,
  queue,
  pendingConflicts,
  wizardInitial,
}: {
  locale: Locale;
  role: StaffRole;
  tab: ImportTab;
  imports: readonly ImportRecord[];
  own: readonly OwnConflict[];
  /** Only for the admin on the «Conflictos» tab. */
  queue: ConflictQueueData | null;
  /** The count in the tab of the admin. */
  pendingConflicts: number;
  wizardInitial?: WizardInitial;
}) {
  const [t, messages] = await Promise.all([
    getTranslations({ locale, namespace: 'crm.import' }),
    getMessages(),
  ]);
  const isAdmin = role === 'admin';
  const current: ImportTab = isAdmin && tab === 'conflictos' ? 'conflictos' : 'importar';

  return (
    <>
      <PageHead title={t('title')} tone={t('tone')} lead={t('lead')} />
      {isAdmin ? (
        <TabNav
          label={t('tabs.label')}
          current={current}
          items={[
            { id: 'importar', label: t('tabs.import'), href: '/crm/importar' },
            {
              id: 'conflictos',
              label: t('tabs.conflicts'),
              href: '/crm/importar?tab=conflictos',
              count: pendingConflicts,
            },
          ]}
        />
      ) : null}
      {current === 'conflictos' && queue ? (
        <ConflictQueue locale={locale} data={queue} />
      ) : (
        <>
          <NextIntlClientProvider messages={{ crm: { import: messages.crm.import } }}>
            <ImportWizard locale={locale} initial={wizardInitial} />
          </NextIntlClientProvider>
          <ImportHistory locale={locale} role={role} imports={imports} own={own} />
        </>
      )}
    </>
  );
}
