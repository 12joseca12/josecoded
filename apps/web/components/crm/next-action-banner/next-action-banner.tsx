import { getFormatter, getTranslations } from 'next-intl/server';

import { Icon } from '@/components/ui/icon';
import { dueState, toInputParts } from '@/lib/crm/next-action';

import { NextActionForm } from '../contact-forms';
import { SheetTrigger } from '../sheet';
import styles from './next-action-banner.module.css';

import type { Locale } from '@josecoded/types';

/**
 * The next action of the contact, on top of the detail: what, when, and how late it is. Overdue is the tinted
 * state with an icon and the word «Vencida»; the buttons open the same sheet (the done action starts empty, since
 * the last one is over and the next one is what matters).
 */
export async function NextActionBanner({
  contactId,
  text,
  at,
  locale,
  now = new Date(),
}: {
  contactId: string;
  text: string | null;
  at: string | null;
  locale: Locale;
  now?: Date;
}) {
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: 'crmContacts.nextAction' }), getFormatter({ locale })]);
  const state = dueState(at, now);
  const parts = toInputParts(at);
  const labels = {
    title: t('sheetTitle'),
    nextAction: t('field'),
    date: t('date'),
    time: t('time'),
    submit: t('save'),
    cancel: t('cancel'),
    locale,
  };
  const day = at ? format.dateTime(new Date(at), { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }) : '';
  const when =
    state === 'overdue'
      ? t('overdue', { day, ago: format.relativeTime(new Date(at!), now) })
      : state === 'today'
        ? t('today')
        : state === 'later'
          ? t('later', { day })
          : t('noDate');

  return (
    <div className={styles.wrap}>
    <div className={styles.banner} role="group" aria-label={t('label')} data-state={state}>
      <Icon name={state === 'overdue' ? 'triangle-alert' : state === 'today' ? 'clock' : 'calendar'} />
      <div className={styles.text}>
        <strong>{text ?? t('none')}</strong>
        <span className={styles.when}>{when}</span>
      </div>
      <div className={styles.buttons}>
        {text ? (
          <SheetTrigger
            label={t('done')}
            ariaLabel={t('doneAria')}
            icon="check"
            size="sm"
            title={t('doneTitle')}
            description={t('doneHelp')}
            closeLabel={t('close')}
            savedMessage={t('saved')}
          >
            <NextActionForm contactId={contactId} current={null} labels={labels} />
          </SheetTrigger>
        ) : null}
        <SheetTrigger
          label={text ? t('change') : t('set')}
          size="sm"
          title={labels.title}
          closeLabel={t('close')}
          savedMessage={t('saved')}
        >
          <NextActionForm contactId={contactId} current={{ text, date: parts?.date ?? null, time: parts?.time ?? null }} labels={labels} />
        </SheetTrigger>
      </div>
    </div>
    </div>
  );
}
