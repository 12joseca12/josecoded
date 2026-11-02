'use client';

import { useLocale, useTranslations } from 'next-intl';

import { reassignContacts } from '@/app/[locale]/(staff)/admin/equipo/actions';
import { CloseWhenSaved, SheetCancel, SheetTrigger } from '@/components/crm/sheet';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';
import { Icon } from '@/components/ui/icon';

import styles from './team-sheets.module.css';

import type { TeamPortfolio } from '@/lib/team/team';

/**
 * «Reasignar cartera»: a closer's whole portfolio, and to whom (`admin_reassign_contacts` moves all of it). The commissions
 * already created stay with the closer they were made for, which the warning says. The button counts what will move.
 */
export function ReassignSheet({
  memberId,
  name,
  portfolio,
  targets,
}: {
  memberId: string;
  name: string;
  portfolio: TeamPortfolio;
  /** The people that may receive the contacts: active, not the person herself. */
  targets: readonly { value: string; label: string }[];
}) {
  const t = useTranslations('adminTeam.sheets.reassign');
  const tShared = useTranslations('adminTeam.sheets');
  const locale = useLocale();
  return (
    <SheetTrigger
      label={t('trigger')}
      ariaLabel={t('triggerFor', { name })}
      icon="user-cog"
      iconOnly
      size="sm"
      title={t('title', { name })}
      closeLabel={tShared('close')}
      savedMessage={t('saved')}
    >
      <Form
        action={reassignContacts}
        submitLabel={t('submit', { count: portfolio.all })}
        label={t('title', { name })}
        actions={<SheetCancel>{tShared('cancel')}</SheetCancel>}
      >
        <CloseWhenSaved />
        <Field kind="hidden" name="locale" value={locale} />
        <Field kind="hidden" name="from" value={memberId} />
        <Field kind="select" name="to" label={t('to')} options={targets} required />
        <p className={styles.note} data-tone="attention">
          <Icon name="triangle-alert" />
          <span>{t('warning', { name })}</span>
        </p>
      </Form>
    </SheetTrigger>
  );
}
