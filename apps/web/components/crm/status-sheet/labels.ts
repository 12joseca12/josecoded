import { getTranslations } from 'next-intl/server';

import { CONTACT_KINDS } from '@josecoded/types';

import { statusesFor } from '@/lib/crm/status';

import type { StatusOptions, StatusSheetLabels } from './types';
import type { StaffRole } from '@/lib/auth/staff';
import type { StatusKey } from '@/lib/crm/status';
import type { Locale } from '@josecoded/types';

/** Texts of the status sheet, translated on the server and handed to the client form as plain strings. */
export async function getStatusSheetLabels(locale: Locale): Promise<StatusSheetLabels> {
  const t = await getTranslations({ locale, namespace: 'crmContacts.statusSheet' });
  return {
    title: t('title'),
    status: t('status'),
    nextAction: t('nextAction'),
    nextActionHelp: t('nextActionHelp'),
    date: t('date'),
    time: t('time'),
    submit: t('submit'),
    cancel: t('cancel'),
    close: t('close'),
    saved: t('saved'),
    locale,
  };
}

/** The statuses each kind offers to this role, labelled. A closer's lists have no «won» nor «active_client». */
export async function getStatusOptions(role: StaffRole, locale: Locale): Promise<StatusOptions> {
  const t = await getTranslations({ locale, namespace: 'crmContacts.status' });
  const entries = CONTACT_KINDS.map((kind) => [kind, statusesFor(kind, role).map((value) => ({ value, label: t(value as StatusKey) }))] as const);
  return Object.fromEntries(entries) as StatusOptions;
}
