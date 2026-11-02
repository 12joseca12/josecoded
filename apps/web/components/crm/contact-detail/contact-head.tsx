import { getTranslations } from 'next-intl/server';

import { StatusBadge } from '@/components/shared/status-badge';
import { PageHead } from '@/components/staff/page-head';
import { Action } from '@/components/ui/action';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { toInputParts } from '@/lib/crm/next-action';
import { statusTone } from '@/lib/crm/status';

import { ReassignForm } from '../contact-forms';
import { OwnerBadge } from '../owner-badge';
import { SheetTrigger } from '../sheet';
import { StatusForm } from '../status-sheet';
import styles from './contact-detail.module.css';

import type { StatusOption, StatusSheetLabels } from '../status-sheet';
import type { ContactRecord } from '@/lib/crm/contact-detail';
import type { Owner } from '@/lib/crm/contacts';
import type { StatusKey } from '@/lib/crm/status';
import type { Locale } from '@josecoded/types';

/**
 * Head of the contact (K3): the way back, the name with its company, the kind, the status and (admin only) the
 * owner with «Reasignar». The one violet action of the view is «Redactar mensaje» (README §4 F); «Estado» is its
 * ghost sibling.
 */
export async function ContactHead({
  contact,
  owners,
  statusOptions,
  statusLabels,
  locale,
}: {
  contact: ContactRecord;
  /** The staff, for the admin only. */
  owners: readonly Owner[] | null;
  statusOptions: readonly StatusOption[];
  statusLabels: StatusSheetLabels;
  locale: Locale;
}) {
  const [t, tKinds, tStatus] = await Promise.all([
    getTranslations({ locale, namespace: 'crmContacts.head' }),
    getTranslations({ locale, namespace: 'crmContacts.kinds' }),
    getTranslations({ locale, namespace: 'crmContacts.status' }),
  ]);
  const parts = toInputParts(contact.next_action_at);
  const owner = owners?.find((candidate) => candidate.user_id === contact.owner_id);
  const ownerOptions = owners
    ? [
        { value: '', label: t('unassigned') },
        ...owners.filter((candidate) => !candidate.disabled).map((candidate) => ({ value: candidate.user_id, label: candidate.display_name })),
      ]
    : [];

  return (
    <header className={styles.headStack}>
      <p className={styles.crumbs}>
        <Action href="/crm/contactos" className={styles.back}>
          <Icon name="arrow-left" />
          {t('back')}
        </Action>
      </p>
      <PageHead
        title={contact.display_name}
        tone={contact.organization?.name ?? tKinds(contact.kind)}
        actions={
          <>
            <SheetTrigger
              label={t('status')}
              title={statusLabels.title}
              description={contact.display_name}
              closeLabel={t('close')}
              savedMessage={statusLabels.saved}
            >
              <StatusForm
                contact={{
                  id: contact.id,
                  name: contact.display_name,
                  organization: contact.organization?.name ?? null,
                  kind: contact.kind,
                  status: contact.status,
                  nextAction: contact.next_action,
                  date: parts?.date ?? null,
                  time: parts?.time ?? null,
                }}
                options={statusOptions}
                labels={statusLabels}
              />
            </SheetTrigger>
            <Button href={`/crm/contactos/${contact.id}?tab=mensajes`} icon="pen-line">
              {t('compose')}
            </Button>
          </>
        }
      />
      <div className={styles.meta}>
        <span className={styles.kind}>{tKinds(contact.kind)}</span>
        <StatusBadge tone={statusTone(contact.status)}>{tStatus(contact.status as StatusKey)}</StatusBadge>
        {owners ? (
          <>
            {owner ? (
              <OwnerBadge state={owner.disabled ? 'off' : 'assigned'} name={owner.display_name} suffix={owner.disabled ? t('ownerOff') : undefined} />
            ) : (
              <OwnerBadge state="unassigned" name={t('unassigned')} />
            )}
            <SheetTrigger
              label={t('reassign')}
              icon="user-cog"
              size="sm"
              title={t('reassignTitle')}
              description={t('reassignHelp')}
              sheetVariant="dialog"
              closeLabel={t('close')}
              savedMessage={t('reassigned')}
            >
              <ReassignForm
                contactId={contact.id}
                currentOwner={contact.owner_id ?? ''}
                labels={{ title: t('reassignTitle'), owner: t('owner'), options: ownerOptions, submit: t('reassignSubmit'), cancel: t('cancel'), locale }}
              />
            </SheetTrigger>
          </>
        ) : null}
      </div>
    </header>
  );
}
