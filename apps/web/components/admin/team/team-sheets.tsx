'use client';

import { useLocale, useTranslations } from 'next-intl';

import { cancelInvite, resendInvite, setRate, setStaff } from '@/app/[locale]/(staff)/admin/equipo/actions';
import { CloseWhenSaved, SheetCancel, SheetTrigger } from '@/components/crm/sheet';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import type { ButtonVariant, IconName, TeamConfirmKind } from '@josecoded/types';

const CONFIRM: Record<
  TeamConfirmKind,
  { variant: ButtonVariant; submit: ButtonVariant; icon?: IconName; action: typeof setStaff | typeof resendInvite | typeof cancelInvite; disabled?: 'true' | 'false' }
> = {
  deactivate: { variant: 'ghost', submit: 'danger', icon: 'ban', action: setStaff, disabled: 'true' },
  activate: { variant: 'quiet', submit: 'solid', action: setStaff, disabled: 'false' },
  resend: { variant: 'ghost', submit: 'solid', action: resendInvite },
  revoke: { variant: 'quiet', submit: 'danger', action: cancelInvite },
};

/** «Editar tasa»: the new rate only touches closings to come; the commissions already created keep theirs. */
export function RateSheet({ memberId, name, rate }: { memberId: string; name: string; rate: number }) {
  const t = useTranslations('adminTeam.sheets');
  const locale = useLocale();
  return (
    <SheetTrigger
      label={t('rate.trigger')}
      ariaLabel={t('rate.triggerFor', { name })}
      icon="pencil"
      iconOnly
      size="sm"
      title={t('rate.title', { name })}
      closeLabel={t('close')}
      savedMessage={t('rate.saved')}
    >
      <Form action={setRate} submitLabel={t('rate.submit')} label={t('rate.title', { name })} actions={<SheetCancel>{t('cancel')}</SheetCancel>}>
        <CloseWhenSaved />
        <Field kind="hidden" name="locale" value={locale} />
        <Field kind="hidden" name="user_id" value={memberId} />
        <Field
          kind="text"
          name="rate"
          label={t('invite.rate')}
          help={t('rate.help')}
          defaultValue={String(rate)}
          inputMode="decimal"
          pattern="[0-9]{1,3}([.,][0-9]{1,2})?"
          maxLength={6}
          trailing="%"
          required
        />
      </Form>
    </SheetTrigger>
  );
}

/**
 * The small decisions of D1 (deactivate, activate, resend, cancel an invitation): a centred dialog that says what will
 * happen, so nothing moves on one click. `target` is the name or the email it is about; `count` the contacts that stay.
 */
export function ConfirmSheet({ kind, id, target, count = 0 }: { kind: TeamConfirmKind; id: string; target: string; count?: number }) {
  const t = useTranslations(`adminTeam.sheets.confirm.${kind}`);
  const tShared = useTranslations('adminTeam.sheets');
  const locale = useLocale();
  const { icon, variant, submit, action, disabled } = CONFIRM[kind];
  const values = { target, count };
  return (
    <SheetTrigger
      label={t('trigger')}
      ariaLabel={t('triggerFor', values)}
      icon={icon}
      iconOnly={icon !== undefined}
      variant={variant}
      size="sm"
      sheetVariant="dialog"
      title={t('title', values)}
      description={t.rich('summary', { ...values, strong: (chunks) => <strong>{chunks}</strong> })}
      closeLabel={tShared('close')}
      savedMessage={t('saved', values)}
    >
      <Form action={action} submitLabel={t('submit')} submitVariant={submit} label={t('title', values)} actions={<SheetCancel>{tShared('cancel')}</SheetCancel>}>
        <CloseWhenSaved />
        <Field kind="hidden" name="locale" value={locale} />
        <Field kind="hidden" name="id" value={id} />
        {disabled ? <Field kind="hidden" name="disabled" value={disabled} /> : null}
      </Form>
    </SheetTrigger>
  );
}
