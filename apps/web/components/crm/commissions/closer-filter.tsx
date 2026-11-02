'use client';

import { Field } from '@/components/forms/field';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { COMMISSIONS_PATH, commissionsHref } from '@/lib/crm/commissions';
import { toLinkTarget } from '@/lib/href';

import styles from './closer-filter.module.css';

import type { CommissionQuery } from '@/lib/crm/commissions';
import type { Href } from '@josecoded/types';

type Target = Parameters<ReturnType<typeof useRouter>['push']>[0];

/**
 * The admin's filter by closer (K5). A plain GET form that works without JavaScript (with a «Filtrar» button); with
 * it, choosing a closer applies at once and without a reload, keeping the status that the totals filter by. The
 * labels arrive translated: the options carry the «(desactivado)» of a closer that was switched off.
 */
export function CloserFilter({
  query,
  options,
  labels,
}: {
  query: CommissionQuery;
  options: readonly { value: string; label: string }[];
  labels: { region: string; closer: string; apply: string; hint: string };
}) {
  const router = useRouter();
  return (
    <search aria-label={labels.region} className={styles.toolbar}>
      <form
        className={styles.form}
        action={COMMISSIONS_PATH}
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          const closer = new FormData(event.currentTarget).get('closer');
          router.push(toLinkTarget(commissionsHref(query, { closer: typeof closer === 'string' && closer ? closer : null }) as Href) as Target);
        }}
        onChange={(event) => event.currentTarget.requestSubmit()}
      >
        {query.status ? <Field kind="hidden" name="status" value={query.status} /> : null}
        <Field kind="select" name="closer" size="compact" label={labels.closer} hideLabel options={options} defaultValue={query.closer ?? ''} />
        <p className={styles.hint}>{labels.hint}</p>
        <div className={styles.apply}>
          <Button type="submit" variant="ghost" size="sm" icon="search">
            {labels.apply}
          </Button>
        </div>
      </form>
    </search>
  );
}
