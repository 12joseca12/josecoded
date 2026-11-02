import { getTranslations } from 'next-intl/server';

import { InviteAccessForm } from '../contact-forms';
import { SheetTrigger } from '../sheet';

import type { StaffRole } from '@/lib/auth/staff';
import type { ClientRow } from '@/lib/crm/clients';
import type { ButtonSize, Locale } from '@josecoded/types';

/**
 * «Habilitar acceso» of a client: the button and the sheet with the invitation, the same form as in the contact's file
 * (`InviteAccessForm`). The invitation goes to the email of the contact; only the admin may write another address, and
 * the database refuses it to anybody else. `again` offers it once more to a client already invited.
 */
export async function ClientInviteButton({
  client,
  role,
  locale,
  size = 'md',
  again = false,
}: {
  client: Pick<ClientRow, 'id' | 'contactId' | 'email' | 'name' | 'organization'>;
  role: StaffRole;
  locale: Locale;
  size?: ButtonSize;
  again?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: 'crmClients.invite' });
  const label = again ? t('again') : t('button');
  return (
    <SheetTrigger
      label={label}
      ariaLabel={t('buttonFor', { client: client.organization ?? client.name })}
      icon="key-round"
      size={size}
      title={t('title')}
      sheetVariant="dialog"
      closeLabel={t('close')}
      savedMessage={t('done')}
    >
      <InviteAccessForm
        clientId={client.id}
        contactId={client.contactId}
        email={client.email ?? ''}
        labels={{
          title: t('title'),
          email: t('email'),
          help: role === 'admin' ? t('helpAdmin') : t('help'),
          emailLocked: role !== 'admin',
          submit: t('submit'),
          cancel: t('cancel'),
          locale,
        }}
      />
    </SheetTrigger>
  );
}
