'use client';

import { useTranslations } from 'next-intl';

import { CloseWhenSaved, SheetCancel, SheetTrigger } from '@/components/crm/sheet';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';
import { Icon } from '@/components/ui/icon';
import { stubTeamAction } from '@/lib/team/stub-actions';

import styles from './team-sheets.module.css';

/**
 * «Invitar»: the one violet action of D1. Email, role, the commission rate (mandatory: the closer is paid by it, and a
 * missing one would be a silent 0 %) and a note only the admin reads. The rate is frozen into every commission when it
 * is created, which the help says. Submitting is a stub until B33.
 */
export function InviteStaffSheet() {
  const t = useTranslations('adminTeam.sheets');
  return (
    <SheetTrigger
      label={t('invite.trigger')}
      icon="user-plus"
      variant="solid"
      title={t('invite.title')}
      closeLabel={t('close')}
      savedMessage={t('invite.saved')}
    >
      <Form action={stubTeamAction} submitLabel={t('invite.submit')} label={t('invite.title')} actions={<SheetCancel>{t('cancel')}</SheetCancel>}>
        <CloseWhenSaved />
        <Field kind="email" name="email" label={t('invite.email')} placeholder={t('invite.emailPlaceholder')} autoComplete="off" required />
        <Field
          kind="radio-group"
          name="role"
          label={t('invite.role')}
          defaultValue="closer"
          options={[{ value: 'closer', label: t('invite.roleCloser'), description: t('invite.roleCloserHint') }]}
        />
        <Field
          kind="text"
          name="rate"
          label={t('invite.rate')}
          help={t('invite.rateHelp')}
          inputMode="decimal"
          pattern="[0-9]{1,3}([.,][0-9]{1,2})?"
          maxLength={6}
          placeholder={t('invite.ratePlaceholder')}
          trailing="%"
          required
        />
        <Field kind="textarea" name="note" label={t('invite.note')} placeholder={t('invite.notePlaceholder')} rows={2} maxLength={500} />
        <p className={styles.note}>
          <Icon name="info" />
          <span>{t('invite.totpNote')}</span>
        </p>
      </Form>
    </SheetTrigger>
  );
}
