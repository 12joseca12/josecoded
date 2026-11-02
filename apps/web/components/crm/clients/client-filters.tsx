import { getTranslations } from 'next-intl/server';

import { Field } from '@/components/forms/field';
import { Action } from '@/components/ui/action';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { ACCESS_FILTERS, CLIENTS_PATH, clientsHref, hasClientFilters } from '@/lib/crm/clients';

import styles from '../contact-filters/contact-filters.module.css';
import { FilterEnhancer } from '../contact-filters/filter-enhancer';

import type { ClientQuery } from '@/lib/crm/clients';
import type { Locale } from '@josecoded/types';

const FORM_ID = 'client-filters';

/**
 * The toolbar of K6 (ref/crm clientes), all in the URL and in the same shape as the inbox's: the search with its
 * hotkey, the state of the portal access as a segmented pill of links (the current one marked) and «Con historias por
 * decidir» as a toggle. One plain GET form that works without JavaScript (with a «Filtrar» button); with it,
 * `FilterEnhancer` applies every change without a reload.
 *
 * A11y: `search` landmark named by its label; the field has a real label (hidden, the toolbar is the context); the access
 * links are a `nav` with `aria-current`; the toggle is a checkbox; «Quitar filtros» is a link.
 */
export async function ClientFilters({ query, locale }: { query: ClientQuery; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'crmClients.filters' });
  const accessLabels = { none: t('accessNone'), invited: t('accessInvited'), active: t('accessActive') } as const;

  return (
    <search aria-label={t('label')} className={styles.toolbar}>
      <form id={FORM_ID} className={styles.form} action={CLIENTS_PATH} method="get">
        {query.access ? <Field kind="hidden" name="access" value={query.access} /> : null}
        <div className={styles.search}>
          <Field
            kind="search"
            name="q"
            size="compact"
            label={t('searchLabel')}
            hideLabel
            placeholder={t('searchPlaceholder')}
            leading="search"
            trailing={<Kbd>{t('hotkey')}</Kbd>}
            hotkey={t('hotkey')}
            defaultValue={query.q ?? ''}
            maxLength={80}
            autoComplete="off"
          />
        </div>
        <nav aria-label={t('access')} className={styles.kind}>
          <ul role="list" className={styles.seg}>
            {[{ value: null, label: t('accessAll') }, ...ACCESS_FILTERS.map((value) => ({ value, label: accessLabels[value] }))].map((item) => (
              <li key={item.value ?? 'all'}>
                <Action
                  href={clientsHref(query, { access: item.value }) as `/${string}`}
                  className={styles.segLink}
                  aria-current={(query.access ?? null) === item.value ? 'true' : undefined}
                >
                  {item.label}
                </Action>
              </li>
            ))}
          </ul>
        </nav>
        <Field
          kind="checkbox"
          appearance="chip"
          name="stories"
          value="1"
          label={t('stories')}
          icon="list-checks"
          defaultChecked={query.stories}
        />
        {hasClientFilters(query) ? (
          <Action href={CLIENTS_PATH} className={styles.clear}>
            {t('clear')}
          </Action>
        ) : null}
        <div className={styles.apply}>
          <Button type="submit" variant="ghost" size="sm" icon="search">
            {t('apply')}
          </Button>
        </div>
      </form>
      <FilterEnhancer formId={FORM_ID} screen="clients" />
    </search>
  );
}
