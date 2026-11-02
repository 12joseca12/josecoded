import { getFormatter, getTranslations } from 'next-intl/server';

import { StatusBadge } from '@/components/shared/status-badge';
import { ArrowLink } from '@/components/ui/arrow-link';
import { accessState } from '@/lib/crm/contact-detail';

import { InviteAccessForm } from '../contact-forms';
import { DetailCard } from '../detail-card';
import { SheetTrigger } from '../sheet';
import styles from './contact-detail.module.css';

import type { StaffRole } from '@/lib/auth/staff';
import type { ClientRecord, ContactRecord, InteractionRecord } from '@/lib/crm/contact-detail';
import type { Locale } from '@josecoded/types';

const PHASES = ['kickoff', 'design', 'build', 'review', 'delivered', 'maintenance'] as const;

/**
 * The client side of the contact: pack, phase of the project and the state of the portal access
 * («Sin invitar · Invitado el … · Con acceso»). «Habilitar acceso» is offered while the client has none; the
 * invitation goes to the email of the contact, and only the admin may write another one.
 */
export async function ClientCard({
  client,
  contact,
  interactions,
  role,
  locale,
}: {
  client: ClientRecord;
  contact: ContactRecord;
  interactions: readonly InteractionRecord[];
  role: StaffRole;
  locale: Locale;
}) {
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: 'crmContacts.client' }), getFormatter({ locale })]);
  const access = accessState(client, interactions);
  const phase = PHASES.indexOf(client.project_phase);
  const email = contact.email ?? '';
  const canInvite = access.state !== 'active' && (role === 'admin' || email !== '');

  return (
    <DetailCard icon="briefcase-business" title={t('title')}>
      <p className={styles.small}>
        {[client.pack_code, client.pack_option].filter(Boolean).join(' · ')}{' '}
        <span className={styles.phase}>
          <span className={styles.bar} aria-hidden="true">
            {PHASES.slice(0, 5).map((name, index) => (
              <i key={name} data-done={index <= phase ? '' : undefined} />
            ))}
          </span>
          {t(`phase.${client.project_phase}`)}
        </span>
      </p>
      <p className={styles.small}>
        <StatusBadge tone={access.state === 'active' ? 'live' : access.state === 'invited' ? 'attention' : 'muted'}>
          {access.state === 'invited'
            ? t('access.invited', { date: format.dateTime(new Date(access.at), { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }) })
            : t(`access.${access.state}`)}
        </StatusBadge>
      </p>
      {access.state !== 'active' && !canInvite ? <p className={`${styles.small} ${styles.muted}`}>{t('noEmail')}</p> : null}
      <div className={styles.actions}>
        {canInvite ? (
          <SheetTrigger
            label={access.state === 'invited' ? t('inviteAgain') : t('invite')}
            icon="key-round"
            size="sm"
            title={t('inviteTitle')}
            sheetVariant="dialog"
            closeLabel={t('close')}
            savedMessage={t('invited')}
          >
            <InviteAccessForm
              clientId={client.id}
              contactId={contact.id}
              email={email}
              labels={{
                title: t('inviteTitle'),
                email: t('email'),
                help: role === 'admin' ? t('emailHelpAdmin') : t('emailHelp'),
                emailLocked: role !== 'admin',
                submit: t('inviteSubmit'),
                cancel: t('cancel'),
                locale,
              }}
            />
          </SheetTrigger>
        ) : null}
        <ArrowLink size="sm" href={`/crm/clientes/${client.id}`}>{t('file')}</ArrowLink>
      </div>
    </DetailCard>
  );
}
