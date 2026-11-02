'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { CloseWhenSaved, SheetCancel, SheetTrigger } from '@/components/crm/sheet';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import type { RuleCandidate, RuleChannel } from '@/lib/notifications/rules';
import type { FormState } from '@josecoded/types';

/**
 * «Añadir persona»: a column of the matrix for someone on the team, over the channel chosen here. It only draws the
 * column (every switch off): the rules exist when the admin turns one on and saves. With nobody left to add, the
 * trigger is not drawn.
 */
export function AddPersonSheet({
  candidates,
  onAdd,
}: {
  candidates: readonly RuleCandidate[];
  onAdd: (userId: string, channel: RuleChannel) => void;
}) {
  const t = useTranslations('adminNotifications');
  const [person, setPerson] = useState(candidates[0]?.id ?? '');
  const [channel, setChannel] = useState<RuleChannel>('telegram');
  const add = async (): Promise<FormState<never>> => {
    if (!person) return { status: 'error', formError: t('sheet.empty') };
    onAdd(person, channel);
    return { status: 'ok' };
  };
  return (
    <SheetTrigger
      label={t('addPerson')}
      icon="user-plus"
      variant="ghost"
      size="sm"
      title={t('sheet.title')}
      description={t('sheet.description')}
      closeLabel={t('sheet.close')}
      savedMessage={t('sheet.saved')}
    >
      <Form action={add} submitLabel={t('sheet.submit')} label={t('sheet.title')} actions={<SheetCancel>{t('sheet.cancel')}</SheetCancel>}>
        <CloseWhenSaved />
        <Field
          kind="select"
          name="person"
          label={t('sheet.person')}
          value={person}
          onChange={setPerson}
          options={candidates.map((candidate) => ({ value: candidate.id, label: candidate.name }))}
        />
        <Field
          kind="select"
          name="channel"
          label={t('sheet.channel')}
          value={channel}
          onChange={(value) => setChannel(value === 'email' ? 'email' : 'telegram')}
          options={[
            { value: 'telegram', label: t('channels.telegram') },
            { value: 'email', label: t('channels.email') },
          ]}
        />
      </Form>
    </SheetTrigger>
  );
}
