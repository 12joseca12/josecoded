import { getTranslations } from 'next-intl/server';

import { PhaseSteps } from '@/components/shared/phase-steps';
import { StatusBadge } from '@/components/shared/status-badge';
import { PageHead } from '@/components/staff/page-head';
import { Action } from '@/components/ui/action';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { accessTone } from '@/lib/crm/clients';

import { ContactLayout } from '../contact-detail';
import { OwnerBadge } from '../owner-badge';
import { accessLabel } from './access-label';
import { ClientAssets } from './client-assets';
import styles from './client-detail.module.css';
import { ClientInviteButton } from './client-invite-button';
import { ClientStories } from './client-stories';
import { ClientTasks } from './client-tasks';

import type { StaffRole } from '@/lib/auth/staff';
import type { ClientFile } from '@/lib/crm/client-queries';
import type { Locale } from '@josecoded/types';

/**
 * K6, the file of one client, as a view of already-read data: the page fetches and guards (a closer asking for a
 * client that is not in her portfolio gets a 404 there) and the dev previews feed it fixtures. The head says who
 * it is and where the project is, with «Habilitar acceso» when there is none; «Historias» is the main column (to read),
 * and the tasks (to read) and, for the admin only, the material sit beside it. A closer is never given the material:
 * the page does not even read it.
 */
export async function ClientDetailView({ locale, role, file }: { locale: Locale; role: StaffRole; file: ClientFile }) {
  const { client, owner, tasks, stories, assets } = file;
  const [tFile, access] = await Promise.all([
    getTranslations({ locale, namespace: 'crmClients.file' }),
    accessLabel(client.access, locale),
  ]);
  const name = client.organization ?? client.name;
  const canInvite = client.access.state !== 'active' && (role === 'admin' || Boolean(client.email));

  return (
    <>
      <header className={styles.headStack}>
        <nav className={styles.crumbs} aria-label={tFile('route')}>
          <Action href="/crm/clientes" className={styles.back}>
            <Icon name="arrow-left" />
            {tFile('back')}
          </Action>
        </nav>
        <PageHead
          title={name}
          tone={client.organization ? client.name : (client.packOption ?? client.packCode)}
          align="start"
          flush
          meta={
            <div className={styles.meta}>
              <Chip>{[client.packCode, client.packOption].filter(Boolean).join(' · ')}</Chip>
              <StatusBadge tone={accessTone(client.access)}>{access}</StatusBadge>
              {client.phase === 'maintenance' ? <StatusBadge tone="live">{tFile('maintenance')}</StatusBadge> : null}
              {role === 'admin' && owner ? <OwnerBadge state={owner.disabled ? 'off' : 'assigned'} name={owner.display_name} /> : null}
            </div>
          }
          actions={
            <>
              <Button href={`/crm/contactos/${client.contactId}`} variant="ghost" icon="user-round">
                {tFile('contact')}
              </Button>
              {canInvite ? <ClientInviteButton client={client} role={role} locale={locale} again={client.access.state === 'invited'} /> : null}
            </>
          }
        />
        <PhaseSteps phase={client.phase} locale={locale} />
      </header>
      <ContactLayout
        sideLabel={tFile('sideLabel')}
        main={<ClientStories stories={stories} locale={locale} />}
        side={
          <>
            <ClientTasks tasks={tasks} role={role} locale={locale} />
            {assets ? <ClientAssets assets={assets} locale={locale} /> : null}
          </>
        }
      />
    </>
  );
}
