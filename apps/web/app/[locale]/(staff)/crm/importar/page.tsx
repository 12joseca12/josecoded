import { getTranslations } from 'next-intl/server';

import { ImportView } from '@/components/crm/import';
import { requireAdmin } from '@/lib/auth/guards';
import { requireStaff } from '@/lib/auth/staff';
import {
  getConflictQueue,
  getImportHistory,
  getOwnConflicts,
  getPendingConflictCount,
} from '@/lib/crm/import-queries';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'crm.import' });
  return { title: t('metaTitle') };
}

/**
 * K4, import contacts from a CSV, for closers and the admin. The wizard and its Server Actions do the work; this page
 * reads the history (the person's own, RLS decides) and, only for the admin, the queue of conflicts behind
 * `?tab=conflictos`. A closer who types that URL gets the import tab: the queue is not hers, and the page does not
 * even read it unless `requireAdmin()` lets it.
 */
export default async function ImportPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  const locale = await resolveLocale(params);
  const raw = await searchParams;
  const { role, supabase, user } = await requireStaff({ locale, next: '/crm/importar' });
  const wantsQueue = role === 'admin' && raw.tab === 'conflictos';
  const admin = wantsQueue
    ? await requireAdmin({ locale, next: '/crm/importar?tab=conflictos' })
    : null;

  const [imports, own, pendingConflicts, queue] = await Promise.all([
    getImportHistory(supabase, role),
    getOwnConflicts(supabase, user.id),
    role === 'admin' ? getPendingConflictCount(supabase) : Promise.resolve(0),
    admin ? getConflictQueue(admin.supabase) : Promise.resolve(null),
  ]);

  return (
    <ImportView
      locale={locale}
      role={role}
      tab={wantsQueue ? 'conflictos' : 'importar'}
      imports={imports}
      own={own}
      queue={queue}
      pendingConflicts={pendingConflicts}
    />
  );
}
