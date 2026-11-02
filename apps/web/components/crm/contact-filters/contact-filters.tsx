import { getTranslations } from 'next-intl/server';

import { CONTACT_KINDS } from '@josecoded/types';

import { Field } from '@/components/forms/field';
import { Action } from '@/components/ui/action';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { CONTACTS_PATH, contactsHref, hasFilters } from '@/lib/crm/contacts-url';
import { statusesFor } from '@/lib/crm/status';

import styles from './contact-filters.module.css';
import { FilterEnhancer } from './filter-enhancer';

import type { Owner } from '@/lib/crm/contacts';
import type { StatusKey } from '@/lib/crm/status';
import type { ContactListQuery, Locale } from '@josecoded/types';

const FORM_ID = 'contact-filters';

/**
 * The toolbar of the inbox (ref/crm K2), all in the URL: the search with its hotkey, the kind as a segmented pill of
 * links (the current one marked), the status and the owner as compact selects and «Solo vencidas» as a toggle. It is
 * one plain GET form, so it works without JavaScript (with a «Filtrar» button); with it, `FilterEnhancer` applies
 * every change without a reload and hides the button. `owners` is given to the admin only: with it the toolbar has
 * the owner filter. `overdue` is the number of overdue contacts of the person, shown on the toggle.
 *
 * A11y: `search` landmark named by its label; each control has a real label (hidden, the toolbar is the context);
 * the kind links are a `nav` with `aria-current`; the toggle is a checkbox; «Quitar filtros» is a link.
 */
export async function ContactFilters({
  query,
  owners,
  overdue,
  locale,
}: {
  query: ContactListQuery;
  owners: readonly Owner[] | null;
  overdue?: number | null;
  locale: Locale;
}) {
  const [t, tKinds, tStatus] = await Promise.all([
    getTranslations({ locale, namespace: 'crmContacts.filters' }),
    getTranslations({ locale, namespace: 'crmContacts.kindsPlural' }),
    getTranslations({ locale, namespace: 'crmContacts.status' }),
  ]);

  const statuses = [...new Set((query.kind ? [query.kind] : CONTACT_KINDS).flatMap((kind) => statusesFor(kind)))];
  const statusOptions = [{ value: '', label: t('statusAll') }, ...statuses.map((value) => ({ value, label: tStatus(value as StatusKey) }))];
  const ownerOptions = owners
    ? [
        { value: '', label: t('ownerAll') },
        { value: 'mine', label: t('ownerMine') },
        { value: 'unassigned', label: t('ownerUnassigned') },
        ...owners.map((owner) => ({ value: owner.user_id, label: owner.disabled ? `${owner.display_name} ${t('ownerOff')}` : owner.display_name })),
      ]
    : null;

  return (
    <search aria-label={t('label')} className={styles.toolbar}>
      <form id={FORM_ID} className={styles.form} action={CONTACTS_PATH} method="get">
        {query.kind ? <Field kind="hidden" name="kind" value={query.kind} /> : null}
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
        <nav aria-label={t('kind')} className={styles.kind}>
          <ul role="list" className={styles.seg}>
            {[
              { value: null, label: t('kindAll') },
              ...CONTACT_KINDS.map((kind) => ({ value: kind, label: tKinds(kind) })),
            ].map((item) => {
              const current = (query.kind ?? null) === item.value;
              return (
                <li key={item.value ?? 'all'}>
                  <Action
                    href={contactsHref(query, { kind: item.value, status: null }) as `/${string}`}
                    className={styles.segLink}
                    aria-current={current ? 'true' : undefined}
                  >
                    {item.label}
                  </Action>
                </li>
              );
            })}
          </ul>
        </nav>
        <Field
          kind="select"
          name="status"
          size="compact"
          label={t('status')}
          hideLabel
          options={statusOptions}
          defaultValue={query.status ?? ''}
        />
        {ownerOptions ? (
          <Field
            kind="select"
            name="owner"
            size="compact"
            label={t('owner')}
            hideLabel
            options={ownerOptions}
            defaultValue={query.owner ?? ''}
          />
        ) : null}
        <Field
          kind="checkbox"
          appearance="chip"
          name="due"
          value="1"
          label={t('due')}
          icon="triangle-alert"
          count={overdue ?? undefined}
          defaultChecked={query.due === true}
        />
        {hasFilters(query) ? (
          <Action href={CONTACTS_PATH} className={styles.clear}>
            {t('clear')}
          </Action>
        ) : null}
        <div className={styles.apply}>
          <Button type="submit" variant="ghost" size="sm" icon="search">
            {t('apply')}
          </Button>
        </div>
      </form>
      <FilterEnhancer formId={FORM_ID} />
    </search>
  );
}
