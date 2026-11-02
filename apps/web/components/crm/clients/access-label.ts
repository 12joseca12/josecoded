import { getFormatter, getTranslations } from 'next-intl/server';

import type { ClientRow } from '@/lib/crm/clients';
import type { Locale } from '@josecoded/types';

/** The access state of a client as the text of a badge: «Invitado el 28 oct». */
export async function accessLabel(access: ClientRow['access'], locale: Locale): Promise<string> {
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: 'crmClients.access' }), getFormatter({ locale })]);
  return access.state === 'invited'
    ? t('invited', { date: format.dateTime(new Date(access.at), { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }) })
    : t(access.state);
}
