import { getLocale, getTranslations } from 'next-intl/server';
import { Fragment } from 'react';

import { Bento, BentoCell, CellText, CtaRow, PackStrip, RateFigure, Scene, SceneAside, SlidingList } from '@/components/scenes';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { Pending } from '@/components/ui/pending';

import { datoText } from './dato';
import { readFact } from './facts';
import { bookingHref, whatsappHref } from './links';
import { PACK_CODES, servicePrices } from './services-data';

import type { Href, Locale } from '@josecoded/types';

/**
 * Scene 2 of the home (home-v7 §10.2): one scene, three cells, 12 + 7 + 5. «Cómo trabajar conmigo»
 * is the featured cell, with the four ways to work (hourly, fixed price, packs, open to hiring) and
 * the panel of the chosen one; below, the five packs (P1–P4 web, P5 app) and the two rates. Every
 * price comes from `@josecoded/pricing`, never from `messages`.
 *
 * `{{DATO}}`: the title, the sentence of each way and the prefilled WhatsApp texts are pending; the
 * CV link too. In production a pending piece is left out; in development it shows as a marker.
 */
export async function ServicesScene() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('home.scenes.services');
  const actions = await getTranslations('actions');
  const nav = await getTranslations('nav');
  const facts = await getTranslations('facts');
  const prices = servicePrices(locale);
  const cv = readFact(facts.raw('cvUrl'));
  const whatsappProject = whatsappHref(String(facts.raw('whatsappProject')));
  const whatsappPacks = whatsappHref(String(facts.raw('whatsappPacks')));
  const price = (code: (typeof PACK_CODES)[number]) => prices.packs.find((pack) => pack.code === code)?.price ?? '';

  const ask = (kase: 'client' | 'recruiter') => (
    <ArrowLink href={`/chat?case=${kase}`} emphasis="strong">
      {actions('askAssistant')}
    </ArrowLink>
  );
  const book = (variant: 'button' | 'link') =>
    variant === 'button' ? (
      <Button href={bookingHref()} icon="calendar">
        {actions('book20')}
      </Button>
    ) : (
      <ArrowLink href={bookingHref()} emphasis="strong">
        {actions('book20')}
      </ArrowLink>
    );
  const lead = (key: 'hourly' | 'fixed' | 'packs' | 'hiring') => {
    const text = datoText(String(t.raw(`vias.${key}.lead`)));
    return text ? <CellText>{text}</CellText> : null;
  };

  const options = [
    { id: 'hourly', icon: 'clock', name: t('vias.hourly.name'), figure: t('vias.hourly.figure', { price: prices.hourly }) },
    { id: 'fixed', icon: 'package-check', name: t('vias.fixed.name'), figure: t('vias.fixed.figure', { price: prices.feature }) },
    { id: 'packs', icon: 'store', name: t('vias.packs.name'), figure: t('vias.packs.figure', { price: prices.fromPack }) },
    { id: 'hiring', icon: 'briefcase', name: t('vias.hiring.name'), figure: t('vias.hiring.figure') },
  ] as const;

  const panels = [
    <Fragment key="hourly">
      {lead('hourly')}
      <CtaRow>
        {book('button')}
        {ask('client')}
      </CtaRow>
    </Fragment>,
    <Fragment key="fixed">
      {lead('fixed')}
      <CtaRow>
        <Button href="/propuesta" icon="sparkles">
          {t('vias.fixed.requestProposal')}
        </Button>
        <ArrowLink href={whatsappProject} emphasis="strong">
          {actions('whatsapp')}
        </ArrowLink>
      </CtaRow>
    </Fragment>,
    <Fragment key="packs">
      {lead('packs')}
      <CtaRow>
        <Button href="/propuesta" icon="sparkles">
          {actions('requestProposal')}
        </Button>
        <ArrowLink href={whatsappPacks} emphasis="strong">
          {actions('whatsapp')}
        </ArrowLink>
      </CtaRow>
    </Fragment>,
    <Fragment key="hiring">
      {lead('hiring')}
      <CtaRow>
        {cv.ready ? (
          <Button href={cv.value as Href} icon="download">
            {t('vias.hiring.downloadCv')}
          </Button>
        ) : (
          <Pending>{cv.value}</Pending>
        )}
        {book('link')}
        {ask('recruiter')}
      </CtaRow>
    </Fragment>,
  ];

  const item = (code: (typeof PACK_CODES)[number]) => ({
    code,
    name: t(`packs.names.${code}`),
    price: price(code),
    description: t('packs.srPrice', { price: price(code) }),
    href: `/servicios?pack=${code}#packs` as const,
  });

  return (
    <Scene
      id="servicios"
      lead={datoText(String(t.raw('title.lead'))) ?? nav('services')}
      tail={datoText(String(t.raw('title.accent')))}
      aside={
        <SceneAside>
          <span>{t('agencyAsk')}</span>
          <ArrowLink href="/partners" emphasis="strong">
            {nav('partners')}
          </ArrowLink>
        </SceneAside>
      }
      fill
    >
      <Bento>
        <BentoCell id="vias" span={12} hero wide icon="route" title={t('vias.title')} note={t('vias.note')}>
          <SlidingList legend={t('vias.title')} options={options} panels={panels} defaultId="hourly" />
        </BentoCell>
        <BentoCell span={7} icon="package" title={t('packs.title')} note={t('packs.note')}>
          <PackStrip web={(['P1', 'P2', 'P3', 'P4'] as const).map(item)} app={[item('P5')]} featured="P2" />
          <ArrowLink href="/servicios#packs" emphasis="strong">
            {t('packs.link')}
          </ArrowLink>
        </BentoCell>
        <BentoCell span={5} tone="tint" icon="receipt" title={t('rates.title')} note={t('rates.note')}>
          <RateFigure
            legend={t('rates.legend')}
            options={[
              {
                id: 'hourly',
                label: t('rates.hourlyTab'),
                figure: t('vias.hourly.figure', { price: prices.hourly }),
                text: t('rates.hourlyText'),
                link: { href: '/servicios#por-hora', label: t('rates.hourlyLink') },
              },
              {
                id: 'fixed',
                label: t('rates.fixedTab'),
                figure: t('vias.fixed.figure', { price: prices.feature }),
                text: t('rates.fixedText'),
                link: { href: '/servicios#proyecto', label: t('vias.fixed.name') },
              },
            ]}
          />
        </BentoCell>
      </Bento>
    </Scene>
  );
}
