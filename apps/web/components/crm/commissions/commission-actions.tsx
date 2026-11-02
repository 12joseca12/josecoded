'use client';

import { useTranslations, useFormatter } from 'next-intl';
import { createContext, useContext, useState } from 'react';

import { Button } from '@/components/ui/button';
import { MONEY_FORMAT } from '@/lib/crm/commissions';

import { Sheet } from '../sheet';
import styles from './commission-actions.module.css';
import { ApproveForm, PayForm, RejectForm } from './commission-forms';

import type { DialogTexts } from './commission-forms';
import type { Locale } from '@josecoded/types';
import type { ReactNode } from 'react';

export type CommissionAction = 'approve' | 'reject' | 'pay';

/** What a dialog needs to know about a commission: plain data, safe to hand to a client component. */
export interface CommissionTarget {
  id: string;
  closer: string;
  /** The contact (or its company) and the pack, as the row shows them. */
  detail: string;
  amount: number;
  base: number;
  percent: number;
}

type Open = (action: CommissionAction, target: CommissionTarget) => void;
const OpenContext = createContext<Open | null>(null);

/** How long to wait for the page to re-render with the new status before giving up on moving the focus. */
const FOCUS_WAIT_MS = 4000;

/**
 * The page re-renders with the new status a moment after the action answers. When the button that opened the dialog is
 * gone by then (its row changed), the row takes the focus; if it is still there (nothing changed), the browser has
 * already given it back and there is nothing to do.
 */
function focusRowWhenChanged(from: Element | null, id: string) {
  const started = Date.now();
  const timer = setInterval(() => {
    if (from?.isConnected && Date.now() - started < FOCUS_WAIT_MS) return;
    clearInterval(timer);
    if (!from?.isConnected) document.getElementById(`commission-${id}`)?.focus();
  }, 60);
}

/**
 * One confirmation dialog for the whole table: the buttons of the rows open it for their commission, 25 rows do not
 * carry 75 dialogs. Wrap the table in it, inside a provider that has `crmCommissions.dialogs`.
 *
 * Each action says what it will record and waits for the confirmation: nothing moves on one click, and paying says
 * that it only registers the transfer. Focus: the native dialog traps it and gives it back to the button that opened
 * it; after a save that button is gone (the row has a new status), so the focus goes to the row, whose new status is
 * then read. The result is announced by the polite status of the `Sheet` («Comisión aprobada»).
 */
export function CommissionActionHost({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = useTranslations('crmCommissions.dialogs');
  const format = useFormatter();
  const [open, setOpen] = useState<{ action: CommissionAction; target: CommissionTarget; opener: Element | null } | null>(null);

  function show(action: CommissionAction, target: CommissionTarget) {
    setOpen({ action, target, opener: document.activeElement });
  }

  const money = (value: number) => format.number(value, MONEY_FORMAT);
  const target = open?.target;
  const action = open?.action;
  const values = target
    ? {
        amount: money(target.amount),
        closer: target.closer,
        detail: target.detail,
        base: money(target.base),
        percent: format.number(target.percent / 100, { style: 'percent', maximumFractionDigits: 2 }),
      }
    : null;

  /** The title, the confirm button and the cancel of the dialog, with the amount in the button of the approval. */
  const texts = (key: CommissionAction, note: ReactNode): DialogTexts => ({
    note,
    title: t(`${key}.title`),
    submit: t(`${key}.submit`, values ?? {}),
    cancel: t('cancel'),
  });

  const common = target && {
    commissionId: target.id,
    locale,
    onSaved: () => focusRowWhenChanged(open.opener, target.id),
  };

  return (
    <OpenContext value={show}>
      {children}
      <Sheet
        open={open !== null}
        onClose={() => setOpen(null)}
        variant="dialog"
        title={action ? t(`${action}.title`) : ''}
        description={values && action ? t.rich(`${action}.summary`, { ...values, strong: (chunks) => <strong>{chunks}</strong> }) : undefined}
        closeLabel={t('close')}
        savedMessage={action ? t(`${action}.saved`) : ''}
      >
        {values && common && action === 'approve' ? (
          <ApproveForm {...common} key={common.commissionId} texts={texts('approve', t('approve.note', values))} />
        ) : null}
        {values && common && action === 'reject' ? (
          <RejectForm
            {...common}
            key={common.commissionId}
            texts={texts('reject', null)}
            reason={t('reject.reason')}
            hint={t('reject.hint', values)}
          />
        ) : null}
        {values && common && action === 'pay' ? (
          <PayForm
            {...common}
            key={common.commissionId}
            texts={texts('pay', t('pay.note'))}
            date={t('pay.date')}
            noteLabel={t('pay.noteLabel')}
            notePlaceholder={t('pay.notePlaceholder')}
          />
        ) : null}
      </Sheet>
    </OpenContext>
  );
}

/**
 * The buttons of a row: only the ones the status allows (`canTransition` decided by the row, which passes them).
 * Each one names its object for assistive technology, and keeps the visible word inside the name.
 */
export function CommissionActionButtons({
  target,
  allow,
  labels,
}: {
  target: CommissionTarget;
  allow: readonly CommissionAction[];
  labels: Record<CommissionAction, { text: string; name: string }>;
}) {
  const open = useContext(OpenContext);
  if (allow.length === 0) return null;
  return (
    <span className={styles.buttons}>
      {allow.map((action) => (
        <Button
          key={action}
          variant={action === 'reject' ? 'quiet' : 'ghost'}
          size="sm"
          icon={action === 'approve' ? 'check' : action === 'pay' ? 'euro' : undefined}
          aria-haspopup="dialog"
          aria-label={labels[action].name}
          onClick={() => open?.(action, target)}
        >
          {labels[action].text}
        </Button>
      ))}
    </span>
  );
}
