'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { StatusBadge } from '@/components/shared/status-badge';
import { PageHead } from '@/components/staff/page-head';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { BASE_COLUMNS, countChanges, personColumnId } from '@/lib/notifications/rules';

import { AddPersonSheet } from './add-person-sheet';
import styles from './rule-editor.module.css';
import { RuleMatrix } from './rule-matrix';

import type { RuleCandidate, RuleChannel, RulesState } from '@/lib/notifications/rules';

/**
 * D3 as the admin works with it: the matrix, the «Guardar» with how many changes wait (decision G: with 48 switches
 * a Save avoids half-applied notices) and «Enviar prueba». The state lives here, in the client, without a library.
 * `editable` is off on the real page until the writes arrive: the matrix is read-only and the buttons are off.
 * With it on (the dev preview) «Guardar» only moves the saved baseline and «Enviar prueba» only says it was sent: the
 * Server Action `setRule` and `notify/test` replace both.
 */
export function RuleEditor({
  initial,
  candidates,
  editable,
}: {
  initial: RulesState;
  candidates: readonly RuleCandidate[];
  editable: boolean;
}) {
  const t = useTranslations('adminNotifications');
  const [people, setPeople] = useState(initial.people);
  const [saved, setSaved] = useState(initial.on);
  const [on, setOn] = useState(() => new Set(initial.on));
  const [status, setStatus] = useState('');
  const changes = countChanges(saved, [...on]);
  const columns = [...BASE_COLUMNS, ...people];
  const free = candidates.filter((candidate) => !people.some((person) => person.userId === candidate.id));

  const toggle = (key: string, value: boolean) => {
    setStatus('');
    setOn((previous) => {
      const next = new Set(previous);
      if (value) next.add(key);
      else next.delete(key);
      return next;
    });
  };
  const addPerson = (userId: string, channel: RuleChannel) => {
    const candidate = candidates.find((item) => item.id === userId);
    if (!candidate) return;
    const id = personColumnId(userId, channel);
    setPeople((previous) => (previous.some((person) => person.id === id) ? previous : [...previous, { id, kind: 'user', channel, userId, name: candidate.name }]));
  };

  return (
    <>
      <PageHead
        title={t('title')}
        tone={t('tone')}
        lead={t('lead')}
        actions={
          <>
            <Button variant="ghost" icon="send" disabled={!editable} onClick={() => setStatus(t('testDone'))}>
              {t('test')}
            </Button>
            <Button
              variant="solid"
              icon="check"
              disabled={!editable}
              onClick={() => {
                setSaved([...on]);
                setStatus(t('saveDone'));
              }}
            >
              {t('save')}
            </Button>
          </>
        }
      />
      {editable ? null : (
        <p className={styles.band} data-tone="info">
          <Icon name="info" />
          <span>{t('readOnlyBand')}</span>
        </p>
      )}
      <div className={styles.toolbar}>
        <div aria-live="polite">{changes > 0 ? <StatusBadge tone="attention">{t('changes', { count: changes })}</StatusBadge> : null}</div>
        <span className={styles.note}>{t('cacheNote')}</span>
        {editable && free.length > 0 ? (
          <div className={styles.end}>
            <AddPersonSheet candidates={free} onAdd={addPerson} />
          </div>
        ) : null}
      </div>
      <p className="sr-only" role="status">
        {status}
      </p>
      <RuleMatrix columns={columns} on={on} editable={editable} onToggle={toggle} />
    </>
  );
}
