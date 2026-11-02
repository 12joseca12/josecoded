'use client';

import { useLocale, useTranslations } from 'next-intl';

import { saveExtra, saveOption, savePack } from '@/app/[locale]/(staff)/admin/contenido/actions';
import { CloseWhenSaved, SheetCancel, SheetTrigger } from '@/components/crm/sheet';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import type { PriceItem, PriceItemKind } from '@/lib/pricing/catalogue';

const LANGS = ['es', 'en'] as const;
const MONEY_PATTERN = '[0-9]{1,6}';
const CODE_PATTERN = { pack: '[A-Z][A-Z0-9_]{1,15}', option: '[a-z][a-z0-9_]{0,31}', extra: '[a-z][a-z0-9_]{1,31}' } as const;
const SAVE = { pack: savePack, option: saveOption, extra: saveExtra } as const;

/**
 * One sheet for every line of the catalogue (pack, option, extra): edit the line it is given, or create a new one
 * (`item` absent; an option is created inside the pack `packCode`). Each text goes in both languages, side by side in
 * reading order; the English one may stay empty (the site then shows the Spanish). The code is chosen once and never
 * edited again: the proposals and the area refer to it (the edit form sends it hidden, with `mode`). Deleting, history
 * and restoring are the next block's screen.
 */
export function PriceItemSheet({ kind, item, packCode }: { kind: PriceItemKind; item?: PriceItem; packCode?: string }) {
  const t = useTranslations('adminPricing.sheet');
  const locale = useLocale();
  const extra = kind === 'extra';
  const title = item ? (extra ? item.name.es : `${item.code} · ${item.name.es}`) : t(`new.${kind}`, { code: packCode ?? '' });
  const icon = item ? 'pencil' : 'plus';
  const iconOnly = item !== undefined || kind === 'option';
  const label = item ? t('edit') : kind === 'option' ? t('addOption') : t(`new.${kind}`, { code: '' });
  const ariaLabel = item ? t('editFor', { name: title }) : kind === 'option' ? t('addOptionTo', { code: packCode ?? '' }) : undefined;

  return (
    <SheetTrigger
      label={label}
      ariaLabel={ariaLabel}
      icon={icon}
      iconOnly={iconOnly}
      variant={kind === 'option' && !item ? 'quiet' : 'ghost'}
      size="sm"
      title={title}
      closeLabel={t('close')}
      savedMessage={t('saved', { name: title })}
    >
      <Form action={SAVE[kind]} submitLabel={t('submit')} label={title} actions={<SheetCancel>{t('cancel')}</SheetCancel>}>
        <CloseWhenSaved />
        <Field kind="hidden" name="locale" value={locale} />
        <Field kind="hidden" name="mode" value={item ? 'edit' : 'create'} />
        {packCode ? <Field kind="hidden" name="pack" value={packCode} /> : null}
        {item ? (
          <Field kind="hidden" name="code" value={item.code} />
        ) : (
          <Field kind="text" name="code" label={t('code')} help={t('codeHelp')} pattern={CODE_PATTERN[kind]} maxLength={32} autoComplete="off" required />
        )}
        {LANGS.map((lang) => (
          <Field
            key={`name-${lang}`}
            kind="text"
            name={`name_${lang}`}
            label={t('name', { lang: t(`lang.${lang}`) })}
            help={lang === 'en' ? t('englishHelp') : undefined}
            defaultValue={item?.name[lang] ?? ''}
            maxLength={120}
            required={lang === 'es'}
          />
        ))}
        {LANGS.map((lang) => (
          <Field
            key={`includes-${lang}`}
            kind="textarea"
            name={`includes_${lang}`}
            label={t(extra ? 'description' : 'includes', { lang: t(`lang.${lang}`) })}
            help={lang === 'es' && !extra ? t('includesHelp') : undefined}
            defaultValue={item?.includes[lang] ?? ''}
            rows={3}
            maxLength={600}
          />
        ))}
        {extra
          ? null
          : LANGS.map((lang) => (
              <Field
                key={`for-${lang}`}
                kind="text"
                name={`for_whom_${lang}`}
                label={t('forWhom', { lang: t(`lang.${lang}`) })}
                defaultValue={item?.forWhom?.[lang] ?? ''}
                maxLength={200}
              />
            ))}
        <Field
          kind="text"
          name="price"
          label={t('price')}
          help={item?.previous != null ? t('priceWas', { amount: item.previous }) : t('priceHelp')}
          inputMode="decimal"
          pattern={MONEY_PATTERN}
          maxLength={9}
          defaultValue={item ? String(item.price) : ''}
          trailing="€"
          required
        />
        {extra ? (
          <Field
            kind="select"
            name="billing"
            label={t('billing')}
            defaultValue={item?.billing ?? 'one_off'}
            options={[
              { value: 'one_off', label: t('billings.one_off') },
              { value: 'monthly', label: t('billings.monthly') },
              { value: 'yearly', label: t('billings.yearly') },
            ]}
          />
        ) : (
          <>
            <Field
              kind="text"
              name="weeks"
              label={t('weeks')}
              inputMode="numeric"
              pattern="[0-9]{1,3}"
              maxLength={3}
              defaultValue={item?.weeks != null ? String(item.weeks) : ''}
              trailing={t('weeksUnit')}
              required
            />
            {kind === 'pack' ? (
              <Field kind="checkbox" name="on_sale" label={t('onSale')} help={t('onSaleHelp')} defaultChecked={item?.onSale ?? true} />
            ) : null}
          </>
        )}
        <Field kind="checkbox" name="visible" label={t('visible')} help={t('visibleHelp')} defaultChecked={item?.visible ?? true} />
      </Form>
    </SheetTrigger>
  );
}
