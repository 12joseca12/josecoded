import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';

import { Backdrop } from '@/components/layout/backdrop';
import { ChatTrigger } from '@/components/layout/chat-trigger';
import { LangSwitch } from '@/components/layout/lang-switch';
import { MenuItem } from '@/components/layout/menu-panel';
import { SearchTrigger } from '@/components/layout/search-trigger';
import { ShellProvider } from '@/components/layout/shell-provider';
import { pickHeaderMessages } from '@/components/layout/site-header/header-messages';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { icons } from '@/components/ui/icon/icons';
import { IconTile } from '@/components/ui/icon-tile';
import { Kbd } from '@/components/ui/kbd';
import { LiveDot } from '@/components/ui/live-dot';
import { Pending } from '@/components/ui/pending';
import { Surface } from '@/components/ui/surface';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import typography from '@/styles/typography.module.css';

import styles from './ui-catalogue.module.css';

import type { ButtonSize, ButtonVariant, IconName } from '@josecoded/types';
import type { ReactNode } from 'react';

const variants: ButtonVariant[] = ['solid', 'ghost', 'quiet'];
const sizes: ButtonSize[] = ['sm', 'md', 'lg'];
const iconNames = Object.keys(icons) as IconName[];
// a text Jose still owes: written as the marker, never translated
// the only shortcuts the interface ever shows (DESIGN.md «Chips / Keys»)
const SHORTCUTS = ['⌘K', 'esc', '↑', '↓', '↵'];
const PENDING_SAMPLE = '{{DATO: ciudad}}';

function Block({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className={styles.block}>
      <p className={styles.caption}>{caption}</p>
      <div className={styles.row}>{children}</div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={styles.section} data-primitive={id}>
      <h2 className={styles.name}>{title}</h2>
      {children}
    </section>
  );
}

/**
 * Every primitive of `components/ui` (and the Backdrop) × variants × sizes × states. Hover and
 * focus are forced with `data-hover` / `data-focus` so they can be seen and captured without a
 * pointer; reduced motion is checked by emulating the media feature in the E2E.
 */
export async function UiCatalogue() {
  const t = await getTranslations('dev.ui');
  const [locale, messages, tNav] = await Promise.all([getLocale(), getMessages(), getTranslations('nav')]);
  const state = (key: 'rest' | 'hover' | 'focus' | 'disabled') => t(`states.${key}`);

  return (
    <>
      <Backdrop />
      <main id="main" className={styles.page}>
        <header className={styles.intro}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={typography.lead}>{t('intro')}</p>
        </header>

        <Section id="Button" title={t('sections.Button')}>
          {variants.map((variant) => (
            <Block key={variant} caption={`${t('variants')}: ${variant}`}>
              {sizes.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {t('samples.viewProjects')}
                </Button>
              ))}
              <Button variant={variant} icon="search">
                {t('samples.search')}
              </Button>
              <Button variant={variant} iconOnly icon="search" aria-label={t('samples.search')} />
            </Block>
          ))}
          <Block caption={`${state('hover')} / ${state('focus')} / ${state('disabled')}`}>
            <Button data-hover="">{t('samples.viewProjects')}</Button>
            <Button variant="ghost" data-hover="">
              {t('samples.book20')}
            </Button>
            <Button data-focus="">{t('samples.viewProjects')}</Button>
            <Button disabled>{t('samples.send')}</Button>
            <Button variant="ghost" disabled>
              {t('samples.send')}
            </Button>
          </Block>
          <Block caption={t('captions.href')}>
            <Button href="/proyectos">{t('samples.viewProjects')}</Button>
            <Button href="https://cal.com" variant="ghost">
              {t('samples.book20')}
            </Button>
          </Block>
        </Section>

        <Section id="ArrowLink" title={t('sections.ArrowLink')}>
          <Block caption={`${state('rest')} - ${t('captions.arrowEmphasis')}`}>
            <ArrowLink href="/servicios">{t('samples.whatIncludes')}</ArrowLink>
            <ArrowLink href="/servicios" emphasis="strong">
              {t('samples.whatIncludes')}
            </ArrowLink>
          </Block>
          <Block caption={`${state('hover')} / ${state('focus')}`}>
            <ArrowLink href="/servicios" data-hover="">
              {t('samples.whatIncludes')}
            </ArrowLink>
            <ArrowLink href="/servicios" emphasis="strong" data-focus="">
              {t('samples.whatIncludes')}
            </ArrowLink>
          </Block>
          <Block caption={t('captions.arrowIcons')}>
            <ArrowLink href="/cv.pdf" icon="download">
              {t('samples.downloadCv')}
            </ArrowLink>
            <ArrowLink href="/chat" icon="message-circle">
              {t('samples.askAssistant')}
            </ArrowLink>
            <ArrowLink>{t('samples.whatIncludes')}</ArrowLink>
          </Block>
        </Section>

        <Section id="Icon" title={t('sections.Icon')}>
          <div className={styles.glyphs}>
            {iconNames.map((name) => (
              <div key={name} className={styles.glyph}>
                <Icon name={name} />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="IconTile" title={t('sections.IconTile')}>
          <Block caption={t('captions.tileVariants')}>
            <IconTile icon="clock" />
            <IconTile icon="clock" tone="solid" />
            <IconTile icon="package-check" size="sm" />
            <IconTile icon="package-check" size="sm" tone="solid" />
          </Block>
        </Section>

        <Section id="Kbd" title={t('sections.Kbd')}>
          <Block caption={t('samples.shortcut')}>
            {SHORTCUTS.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </Block>
        </Section>

        <Section id="Chip" title={t('sections.Chip')}>
          <Block caption={t('samples.stack')}>
            <Chip>{t('samples.stack')}</Chip>
            <Chip>{t('samples.stackTwo')}</Chip>
          </Block>
        </Section>

        <Section id="LiveDot" title={t('sections.LiveDot')}>
          <Block caption={t('samples.live')}>
            <LiveDot />
          </Block>
        </Section>

        <Section id="Pending" title={t('sections.Pending')}>
          <Block caption={t('captions.pending')}>
            <Pending>{PENDING_SAMPLE}</Pending>
          </Block>
        </Section>

        <Section id="Surface" title={t('sections.Surface')}>
          <Block caption={t('captions.surfaceVariants')}>
            {(['cell', 'tcard'] as const).flatMap((radius) =>
              (['card', 'overlay'] as const).map((layer) => (
                <Surface key={`${radius}-${layer}`} radius={radius} layer={layer}>
                  <div className={styles.cell}>
                    <IconTile icon="store" />
                    <p className={typography.lead}>{t('samples.cellBody')}</p>
                  </div>
                </Surface>
              )),
            )}
          </Block>
          <Block caption={`${t('captions.interactive')}: ${state('rest')} / ${state('hover')}`}>
            <Surface interactive>
              <div className={styles.cell}>
                <p className={typography.small}>{state('rest')}</p>
              </div>
            </Surface>
            <Surface interactive data-hover="">
              <div className={styles.cell}>
                <p className={typography.small}>{state('hover')}</p>
              </div>
            </Surface>
          </Block>
        </Section>

        <Section id="TwoToneHeading" title={t('sections.TwoToneHeading')}>
          <TwoToneHeading lead={t('samples.headingLead')} tail={t('samples.headingTail')} />
          <TwoToneHeading
            lead={t('samples.closingLead')}
            tail={t('samples.closingTail')}
            size="display-closing"
          />
          <TwoToneHeading lead={t('samples.headingLead')} tail={<Pending>{PENDING_SAMPLE}</Pending>} />
        </Section>

        <Section id="Typography" title={t('sections.Typography')}>
          <p className={typography.lead}>{t('samples.lead')}</p>
          <p className={typography.muted}>{t('samples.muted')}</p>
          <p className={typography.small}>{t('samples.small')}</p>
        </Section>

        <Section id="Shell" title={t('sections.Shell')}>
          <NextIntlClientProvider locale={locale} messages={pickHeaderMessages(messages)}>
            <ShellProvider>
              <Block caption={t('captions.langSwitch')}>
                <LangSwitch variant="inline" />
                <LangSwitch variant="segmented" />
              </Block>
              <Block caption={t('captions.searchInert')}>
                <SearchTrigger />
              </Block>
              <Block caption={t('captions.chatTrigger')}>
                <ChatTrigger href="/chat" label={tNav('chat')} aria-label={tNav('chatOpen')} />
                <ChatTrigger label={tNav('chat')} aria-label={tNav('chatOpen')} />
              </Block>
              <Block caption={t('captions.menuItem')}>
                <MenuItem href="/perfil">{tNav('profile')}</MenuItem>
                <MenuItem href="/contacto" highlighted>
                  {tNav('contact')}
                </MenuItem>
                <MenuItem separated>{tNav('signOut')}</MenuItem>
              </Block>
            </ShellProvider>
          </NextIntlClientProvider>
        </Section>
      </main>
    </>
  );
}
