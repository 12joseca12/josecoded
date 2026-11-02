'use client';

import { useLocale, useTranslations } from 'next-intl';

import { inviteStaff } from '@/app/[locale]/(staff)/admin/equipo/actions';
import { CloseWhenSaved, SheetCancel, SheetTrigger } from '@/components/crm/sheet';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';
import { Icon } from '@/components/ui/icon';

import styles from './team-sheets.module.css';

/**
 * «Invitar»: the one violet action of D1. Email, role, the commission rate (mandatory: the closer is paid by it, and a
 * missing one would be a silent 0 %). The rate is frozen into every commission when it is created, which the help says.
 * There is no note: `staff_invites` has no column for it (DATOS §14) and the email is a fixed template.
 */
export function InviteStaffSheet() {
  const t = useTranslations('adminTeam.sheets');
  const locale = useLocale();
  return (
    <SheetTrigger
      label={t('invite.trigger')}
      icon="user-plus"
      variant="solid"
      title={t('invite.title')}
      closeLabel={t('close')}
      savedMessage={t('invite.saved')}
    >
      <Form action={inviteStaff} submitLabel={t('invite.submit')} label={t('invite.title')} actions={<SheetCancel>{t('cancel')}</SheetCancel>}>
        <CloseWhenSaved />
        <Field kind="hidden" name="locale" value={locale} />
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
        <p className={styles.note}>
          <Icon name="info" />
          <span>{t('invite.totpNote')}</span>
        </p>
      </Form>
    </SheetTrigger>
  );
}
