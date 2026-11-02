'use client';

import { useState } from 'react';

import { computeUpgrade, formatPrice, pricing } from '@josecoded/pricing';

import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';
import { extraLabel, packLabel } from '@/lib/area/packs';

import styles from './upgrade-form.module.css';

import type { ExtraCode, FormState, Locale, PackCode } from '@josecoded/types';

type UpgradeAction = (
  previous: FormState<{ toPack: string; extras: string }>,
  data: FormData,
) => Promise<FormState<{ toPack: string; extras: string }>>;

export interface UpgradeFormLabels {
  packLegend: string;
  packNone: string;
  extrasLegend: string;
  extraMonthly: string;
  total: string;
  totalHelp: string;
  nothing: string;
  noOptions: string;
  submit: string;
  form: string;
}

/**
 * Upgrade request: a higher pack (never the same or a lower one: they are not offered) and/or extras
 * the client does not have yet, with the price shown live. The number on screen is `computeUpgrade`
 * (list difference plus extras at list price); the request carries only the CHOICE, and the database
 * recomputes the price in `request_upgrade`, so what is shown can never be what is charged by mistake.
 *
 * A11y: a radio group and a checkbox group, each with its legend (fieldset); the total is an
 * `<output>` inside a polite live region; the submit button is the form's only violet action.
 */
export function UpgradeForm({
  currentPack,
  ownedExtras = [],
  locale,
  action,
  labels,
}: {
  currentPack: string;
  /** Extras the client already has (included or active): not offered again. */
  ownedExtras?: readonly string[];
  locale: Locale;
  action: UpgradeAction;
  labels: UpgradeFormLabels;
}) {
  const [toPack, setToPack] = useState('');
  const [extras, setExtras] = useState<readonly string[]>([]);

  const current = pricing.packs.find((pack) => pack.code === currentPack);
  const higherPacks = current ? pricing.packs.filter((pack) => pack.price > current.price) : [];
  const availableExtras = pricing.extras.filter((extra) => !ownedExtras.includes(extra.code));

  let total: number | null = null;
  if (current && (toPack || extras.length > 0)) {
    try {
      total = computeUpgrade(current.code, (toPack || null) as PackCode | null, extras as ExtraCode[]).price;
    } catch {
      total = null;
    }
  } else if (!current && extras.length > 0) {
    total = extras.reduce((sum, code) => sum + (pricing.extras.find((e) => e.code === code)?.price ?? 0), 0);
  }

  if (higherPacks.length === 0 && availableExtras.length === 0) {
    return <p>{labels.noOptions}</p>;
  }

  return (
    <Form action={action} submitLabel={labels.submit} label={labels.form}>
      <Field kind="hidden" name="locale" value={locale} />
      {higherPacks.length > 0 ? (
        <Field
          kind="radio-group"
          name="toPack"
          label={labels.packLegend}
          defaultValue=""
          onChange={setToPack}
          options={[
            { value: '', label: labels.packNone },
            ...higherPacks.map((pack) => ({
              value: pack.code,
              label: `${packLabel(pack.code, locale)} · ${formatPrice(pack.price, locale)}`,
            })),
          ]}
        />
      ) : null}
      <fieldset className={styles.extras}>
        <legend className={styles.legend}>{labels.extrasLegend}</legend>
        {availableExtras.map((extra) => (
          <Field
            key={extra.code}
            kind="checkbox"
            name="extras"
            value={extra.code}
            label={`${extraLabel(extra.code, locale)} · ${formatPrice(extra.price, locale)}${
              extra.billing === 'monthly' ? ` ${labels.extraMonthly}` : ''
            }`}
            onChange={(checked) =>
              setExtras((previous) =>
                checked ? [...previous, extra.code] : previous.filter((code) => code !== extra.code),
              )
            }
          />
        ))}
      </fieldset>

      <div className={styles.total} role="group" aria-label={labels.total}>
        <p className={styles.totalLabel}>{labels.total}</p>
        <output className={styles.price} aria-live="polite">
          {total === null ? labels.nothing : formatPrice(total, locale)}
        </output>
        <p className={styles.help}>{labels.totalHelp}</p>
      </div>
    </Form>
  );
}
