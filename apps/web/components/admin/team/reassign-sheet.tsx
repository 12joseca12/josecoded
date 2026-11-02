'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { CloseWhenSaved, SheetCancel, SheetTrigger } from '@/components/crm/sheet';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';
import { Icon } from '@/components/ui/icon';
import { stubTeamAction } from '@/lib/team/stub-actions';

import styles from './team-sheets.module.css';

import type { TeamPortfolio } from '@/lib/team/team';

type Scope = keyof TeamPortfolio;
const SCOPES: readonly Scope[] = ['all', 'openLeads', 'agencies'];

/**
 * «Reasignar cartera»: which of a closer's contacts (all, the open leads, the agencies), and to whom. The commissions
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
  const [scope, setScope] = useState<Scope>('all');
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
        action={stubTeamAction}
        submitLabel={t('submit', { count: portfolio[scope] })}
        label={t('title', { name })}
        actions={<SheetCancel>{tShared('cancel')}</SheetCancel>}
      >
        <CloseWhenSaved />
        <Field kind="hidden" name="from" value={memberId} />
        <Field
          kind="radio-group"
          name="scope"
          label={t('scope')}
          defaultValue="all"
          onChange={(value) => setScope(value as Scope)}
          options={SCOPES.map((value) => ({ value, label: t(`scopes.${value}`), description: String(portfolio[value]) }))}
        />
        <Field kind="select" name="to" label={t('to')} options={targets} />
        <p className={styles.note} data-tone="attention">
          <Icon name="triangle-alert" />
          <span>{t('warning', { name })}</span>
        </p>
      </Form>
    </SheetTrigger>
  );
}
