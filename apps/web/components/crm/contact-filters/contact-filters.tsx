import { getTranslations } from 'next-intl/server';

import { CONTACT_KINDS } from '@josecoded/types';

import { Field } from '@/components/forms/field';
import { Action } from '@/components/ui/action';
import { Button } from '@/components/ui/button';
import { CONTACTS_PATH, contactsHref, hasFilters } from '@/lib/crm/contacts-url';
import { statusesFor } from '@/lib/crm/status';

import styles from './contact-filters.module.css';

import type { Owner } from '@/lib/crm/contacts';
import type { StatusKey } from '@/lib/crm/status';
import type { ContactListQuery, Locale } from '@josecoded/types';

/**
 * Filters of the inbox, all in the URL: the kind as a row of links (current one marked), the rest as a plain GET
 * form that works without JavaScript. `owners` is given to the admin only; with it the form has the owner filter.
 *
 * A11y: `search` landmark named by its label; the kind links are a `nav` with `aria-current`; every control is a
 * `Field` with its label; «Quitar filtros» is a link.
 */
export async function ContactFilters({
  query,
  owners,
  locale,
}: {
  query: ContactListQuery;
  owners: readonly Owner[] | null;
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
    <div className={styles.filters}>
      <nav aria-label={t('kind')}>
        <ul role="list" className={styles.seg}>
          {[{ value: null, label: t('kindAll') }, ...CONTACT_KINDS.map((kind) => ({ value: kind, label: tKinds(kind) }))].map((item) => {
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
      <search aria-label={t('label')}>
        <form className={styles.form} action={CONTACTS_PATH} method="get">
          {query.kind ? <Field kind="hidden" name="kind" value={query.kind} /> : null}
          <Field kind="text" name="q" label={t('search')} defaultValue={query.q ?? ''} maxLength={80} autoComplete="off" />
          <Field kind="select" name="status" label={t('status')} options={statusOptions} defaultValue={query.status ?? ''} />
          {ownerOptions ? <Field kind="select" name="owner" label={t('owner')} options={ownerOptions} defaultValue={query.owner ?? ''} /> : null}
          <Field kind="checkbox" name="due" value="1" label={t('due')} defaultChecked={query.due === true} />
          <div className={styles.actions}>
            <Button type="submit" variant="ghost" icon="search">
              {t('apply')}
            </Button>
            {hasFilters(query) ? (
              <Action href={CONTACTS_PATH} className={styles.clear}>
                {t('clear')}
              </Action>
            ) : null}
          </div>
        </form>
      </search>
    </div>
  );
}
