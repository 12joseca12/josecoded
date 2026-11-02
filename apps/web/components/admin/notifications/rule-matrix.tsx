'use client';

import { useTranslations } from 'next-intl';

import { Field } from '@/components/forms/field';
import { RULE_EVENTS, appliesTo, ruleKey } from '@/lib/notifications/rules';

import styles from './rule-matrix.module.css';

import type { RuleColumn } from '@/lib/notifications/rules';

/**
 * The matrix of D3: a real table, one row per event (row header with what it is) and one column per recipient and
 * channel (column header). Every cell where it makes sense is a switch; where it does not, a dash that says «No
 * aplica». Below 46rem of its own width each row becomes a block with its switches stacked, which is why the roles
 * are explicit. The switches are the page's own tab stops, in reading order.
 *
 * A11y: `caption` names the table; each switch is named «event → recipient · channel» (the stacked cell also shows
 * «recipient · channel» before it); `role="switch"` on a checkbox, Space toggles it; focus ring from `Field`.
 */
export function RuleMatrix({
  columns,
  on,
  editable,
  onToggle,
}: {
  columns: readonly RuleColumn[];
  on: ReadonlySet<string>;
  editable: boolean;
  onToggle: (key: string, value: boolean) => void;
}) {
  const t = useTranslations('adminNotifications');
  const columnName = (column: RuleColumn) =>
    column.kind === 'user' ? column.name : t(`recipients.${column.kind}`);
  const columnText = (column: RuleColumn) =>
    t('columnLabel', { recipient: columnName(column), channel: t(`channels.${column.channel}`) });
  return (
    <div className={styles.box}>
      <table className={styles.table} role="table">
        <caption className="sr-only">{t('tableCaption')}</caption>
        <thead role="rowgroup" className={styles.head}>
          <tr role="row">
            <th role="columnheader" scope="col" className={styles.start}>
              {t('event')}
            </th>
            {columns.map((column) => (
              <th key={column.id} role="columnheader" scope="col" className={styles.col}>
                {columnName(column)}
                <small>{t(`channels.${column.channel}`)}</small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup" className={styles.body}>
          {RULE_EVENTS.map((event) => {
            const name = t(`events.${event.id}.name`);
            return (
              <tr key={event.id} role="row" className={styles.row}>
                <th role="rowheader" scope="row" className={styles.event}>
                  {name}
                  <span>{t(`events.${event.id}.hint`)}</span>
                </th>
                {columns.map((column) => {
                  if (!appliesTo(event, column)) {
                    return (
                      <td key={column.id} role="cell" className={styles.na} data-na="">
                        <span aria-hidden="true">{t('dash')}</span>
                        <span className="sr-only">{t('notApplicable')}</span>
                      </td>
                    );
                  }
                  const key = ruleKey(event.id, column.id);
                  return (
                    <td key={column.id} role="cell" className={styles.cell} data-label={columnText(column)}>
                      <Field
                        kind="checkbox"
                        appearance="switch"
                        name={key}
                        label={t('cellLabel', { event: name, column: columnText(column) })}
                        defaultChecked={on.has(key)}
                        disabled={!editable}
                        onChange={(checked) => onToggle(key, checked)}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
