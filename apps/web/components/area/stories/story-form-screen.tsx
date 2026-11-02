import { getTranslations } from 'next-intl/server';

import { AreaCard, AreaGrid } from '@/components/area/area-card';
import { Button } from '@/components/ui/button';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';

import styles from './stories.module.css';
import { StoryForm } from './story-form';

import type { StoryAction } from './story-form';
import type { Href, Locale } from '@josecoded/types';

/**
 * «Proponer una historia»: heading, the way back and the form in its card. The action is a prop: the real page passes
 * the Server Action (B16), the `/dev` preview one that validates and saves nothing.
 */
export async function StoryFormScreen({
  locale,
  action,
  back,
}: {
  locale: Locale;
  action: StoryAction;
  back: Href;
}) {
  const t = await getTranslations({ locale, namespace: 'area.stories' });
  const f = await getTranslations({ locale, namespace: 'area.stories.form' });
  const raw = (key: Parameters<typeof f.raw>[0]) => f.raw(key) as string;

  return (
    <>
      <header className={styles.head}>
        <div className={styles.actions}>
          <Button href={back} variant="ghost" size="sm" icon="arrow-left">
            {t('back')}
          </Button>
        </div>
        <TwoToneHeading level="h1" lead={t('form.heading.lead')} tail={t('form.heading.tail')} />
        <p className={styles.lede}>{t('form.intro')}</p>
      </header>
      <AreaGrid>
        <AreaCard id="story-form" title={t('form.label')} span="full">
          <div className={styles.formBox}>
            <StoryForm
              action={action}
              locale={locale}
              labels={{
                form: raw('label'),
                title: raw('title'),
                titleHelp: raw('titleHelp'),
                asA: raw('as_a'),
                asHelp: raw('asHelp'),
                iWant: raw('i_want'),
                wantHelp: raw('wantHelp'),
                soThat: raw('so_that'),
                soHelp: raw('soHelp'),
                criteriaLegend: raw('criteriaLegend'),
                criteriaHelp: raw('criteriaHelp'),
                criterion: raw('criterion'),
                remove: raw('remove'),
                removeShort: raw('removeShort'),
                add: raw('add'),
                max: raw('max'),
                added: raw('added'),
                removed: raw('removed'),
                submit: raw('submit'),
                sent: raw('sent'),
              }}
            />
          </div>
        </AreaCard>
      </AreaGrid>
    </>
  );
}
