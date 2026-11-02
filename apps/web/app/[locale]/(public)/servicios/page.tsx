import { getTranslations } from 'next-intl/server';

import { pricing } from '@josecoded/pricing';

import { datoText } from '@/components/home/dato';
import { readFact } from '@/components/home/facts';
import { bookingHref, whatsappHref } from '@/components/home/links';
import { projectArt, projectHref } from '@/components/home/projects-data';
import { PACK_CODES, servicePrices } from '@/components/home/services-data';
import { Bento, BentoCell, CellText, PackStrip, ProjectCard  } from '@/components/scenes';
import { JsonLd } from '@/components/seo';
import { ExtraList } from '@/components/services/extra-list';
import { HiringCard } from '@/components/services/hiring-card';
import { PackCompare } from '@/components/services/pack-compare';
import { StickyCtaBar } from '@/components/services/sticky-cta-bar';
import { WayNav } from '@/components/services/way-nav';
import { WaySection } from '@/components/services/way-section';
import { CheckList } from '@/components/shared/check-list';
import { ClosingCompact } from '@/components/shared/closing-compact';
import { FactList } from '@/components/shared/fact-list';
import { Faq, FaqJsonLd } from '@/components/shared/faq';
import { PageHead } from '@/components/shared/page-head';
import { PageSection } from '@/components/shared/page-section';
import { ProcessSteps } from '@/components/shared/process-steps';
import { WhatsAppButton } from '@/components/shared/whatsapp-button';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { services } from '@/content';
import { faqEntries } from '@/lib/content/faq';
import { identitySentence } from '@/lib/content/identity';
import { tourProjects } from '@/lib/content/projects';
import { env } from '@/lib/env';
import { resolveLocale } from '@/lib/locale';
import { loadFacts } from '@/lib/seo/facts-server';
import { graphOf, serviceOfferJsonLd } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/page-metadata';
import { absoluteUrl, siteUrl } from '@/lib/seo/urls';
import { extraItems, packColumns } from '@/lib/services/packs';

import styles from './page.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Href } from '@josecoded/types';
import type { Metadata } from 'next';

async function copyOf(locale: 'es' | 'en') {
  const t = await getTranslations({ locale, namespace: 'services' });
  const prices = servicePrices(locale);
  return { t, prices };
}

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t, prices } = await copyOf(locale);
  return pageMetadata({
    locale,
    pathname: '/servicios',
    title: t('meta.title'),
    description: t('meta.description', { hourly: prices.hourly, feature: prices.feature, packFrom: prices.fromPack }),
  });
}

// P20 (pantallas v2.0): four ways to work, five packs, hiring card, process, proofs and FAQ. Every price
// comes from @josecoded/pricing; the texts of `{{DATO}}` that Jose still owes are left out of production.
export default async function ServicesPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const { t, prices } = await copyOf(locale);
  const identity = await getTranslations({ locale, namespace: 'about.identity' });
  const homeNames = await getTranslations({ locale, namespace: 'home.scenes.services.packs.names' });
  const projectsT = await getTranslations({ locale, namespace: 'home.scenes.projects' });
  const actions = await getTranslations({ locale, namespace: 'actions' });
  const factsT = await getTranslations({ locale, namespace: 'facts' });
  const facts = await loadFacts(locale);

  const way = Object.fromEntries(services.ways.map((item) => [item.code, item])) as Record<
    (typeof services.ways)[number]['code'],
    (typeof services.ways)[number]
  >;
  const anchor = (code: keyof typeof way) => way[code].anchor[locale];

  const cv = readFact(factsT.raw('cvUrl'));
  const whatsappProject = whatsappHref(String(factsT.raw('whatsappProject')));
  const whatsappPacks = whatsappHref(String(factsT.raw('whatsappPacks')));
  const booking = bookingHref();
  const hasWhatsapp = Boolean(env.client.NEXT_PUBLIC_WHATSAPP_NUMBER);

  const columns = packColumns(locale, {
    names: Object.fromEntries(PACK_CODES.map((code) => [code, homeNames(code)])) as Record<(typeof PACK_CODES)[number], string>,
    includes: {
      P1: t('packs.P1.includes'),
      P2: t('packs.P2.includes'),
      P3: t('packs.P3.includes'),
      P4: t('packs.P4.includes'),
      P5: t('packs.P5.includes'),
    },
    from: (price) => t('compare.from', { price }),
    request: t('compare.request'),
    requestName: (values) => t('compare.requestName', values),
    plus: {
      name: t('packs.P5plus.name'),
      includes: t('packs.P5plus.includes'),
      intro: (values) => t('compare.optionIntro', values),
    },
  });
  const extras = extraItems(locale, {
    names: t.raw('extras.names' as never) as Record<string, { label: string; description: string } | undefined>,
    monthly: t('extras.monthly'),
  });

  const faq = (via: 'hourly' | 'fixed' | 'packs' | 'hiring') => faqEntries('services', locale, via);
  const allFaq = [...faq('hourly'), ...faq('fixed'), ...faq('packs'), ...faq('hiring')];

  const stripItem = (code: (typeof PACK_CODES)[number]) => ({
    code,
    name: homeNames(code),
    price: prices.packs.find((pack) => pack.code === code)?.price ?? '',
    description: t('compare.from', { price: prices.packs.find((pack) => pack.code === code)?.price ?? '' }),
    href: `/servicios?pack=${code}#${anchor('packs')}` as Href,
  });

  const citable = t('head.citable', {
    identity: identitySentence(identity, facts),
    hourly: `${prices.hourly}/h`,
    feature: prices.feature,
    packFrom: prices.fromPack,
  });

  const servicesUrl = absoluteUrl(locale, '/servicios');
  const nodes = serviceOfferJsonLd({
    siteUrl: siteUrl(),
    locale,
    pricing,
    servicesUrl,
    labels: {
      hourly: (await getTranslations({ locale, namespace: 'seo.services' }))('hourly'),
      fixed: (await getTranslations({ locale, namespace: 'seo.services' }))('fixed'),
      packs: (await getTranslations({ locale, namespace: 'seo.services' }))('packs'),
    },
    anchors: { hourly: anchor('hourly'), fixed: anchor('fixed'), packs: anchor('packs') },
  });

  const processSteps = services.process.map((id) => ({
    id,
    title: t(`process.steps.${id as 'talk' | 'proposal' | 'demos' | 'delivery'}.title`),
    text: t(`process.steps.${id as 'talk' | 'proposal' | 'demos' | 'delivery'}.text`),
  }));

  const hourlyFigure = `${prices.hourly}/h`;
  const where = facts.city ? t('facts.whereCity', { city: facts.city }) : t('facts.whereRemote');
  const factItems = [
    { id: 'what', term: t('facts.terms.what'), value: t('facts.what') },
    { id: 'where', term: t('facts.terms.where'), value: where },
    { id: 'stack', term: t('facts.terms.stack'), value: t('facts.stack') },
    {
      id: 'rates',
      term: t('facts.terms.rates'),
      value: t('facts.rates', { hourly: `${prices.hourly}/h`, feature: prices.feature, packFrom: prices.fromPack }),
    },
    { id: 'ways', term: t('facts.terms.ways'), value: t('facts.ways') },
    { id: 'languages', term: t('facts.terms.languages'), value: t('facts.languages') },
  ];

  const hiringText = datoText(String(t.raw('ways.hiring.text')));
  const whatsappLabel = actions('whatsapp');
  const tourSheets = tourProjects();

  return (
    <>
      <PageHead
        lead={t('head.lead')}
        tail={t('head.accent')}
        citable={citable}
        actions={
          <>
            <Button href="/propuesta" icon="sparkles">
              {t('head.proposal')}
            </Button>
            <ArrowLink href={`#${anchor('packs')}`} emphasis="strong">
              {t('head.seePacks')}
            </ArrowLink>
          </>
        }
      />
      <WayNav
        label={t('nav.label')}
        ways={services.ways.map((item) => ({ id: item.anchor[locale], label: t(`nav.${item.code}`) }))}
      />

      <WaySection
        id={anchor('hourly')}
        lead={t('ways.hourly.lead')}
        tail={t('ways.hourly.accent', { price: `${prices.hourly}/h` })}
        text={t('ways.hourly.text', { price: `${prices.hourly}/h` })}
        actions={
          <>
            <Button href={booking} icon="calendar">
              {actions('book20')}
            </Button>
            <ArrowLink href="/chat?case=client" emphasis="strong">
              {actions('askAssistant')}
            </ArrowLink>
          </>
        }
      >
        <Bento>
          <BentoCell span={7} icon="layers" title={t('ways.hourly.includesTitle')}>
            <CheckList
              items={(['dev', 'consulting', 'audit', 'training'] as const).map((id) => ({
                id,
                text: t(`ways.hourly.includes.${id}`),
              }))}
            />
          </BentoCell>
          <BentoCell span={5} tone="tint" icon="receipt" title={t('ways.hourly.rateTitle')} note={t('ways.hourly.rateNote')}>
            <CellText variant="title">{hourlyFigure}</CellText>
          </BentoCell>
        </Bento>
      </WaySection>

      <WaySection
        id={anchor('fixed')}
        lead={t('ways.fixed.lead')}
        tail={t('ways.fixed.accent', { price: prices.feature })}
        text={t('ways.fixed.text')}
        actions={
          <>
            <Button href="/propuesta" icon="sparkles">
              {t('head.proposal')}
            </Button>
            {hasWhatsapp ? (
              <WhatsAppButton href={whatsappProject} label={whatsappLabel} origin="services-fixed" variant="link" />
            ) : null}
          </>
        }
      >
        <Bento>
          <BentoCell span={7} icon="package-check" title={t('ways.fixed.whatTitle')}>
            <CellText>{t('ways.fixed.what')}</CellText>
          </BentoCell>
          <BentoCell span={5} tone="tint" icon="receipt" title={t('ways.fixed.accent', { price: prices.feature })} note={t('ways.fixed.priceNote')}>
            <CellText variant="title">{prices.feature}</CellText>
          </BentoCell>
        </Bento>
      </WaySection>

      <WaySection
        id={anchor('packs')}
        lead={t('ways.packs.lead')}
        tail={t('ways.packs.accent', { price: prices.fromPack })}
        text={t('ways.packs.text')}
        actions={
          <>
            <Button href="/propuesta" icon="sparkles">
              {actions('requestProposal')}
            </Button>
            {hasWhatsapp ? (
              <WhatsAppButton href={whatsappPacks} label={whatsappLabel} origin="services-packs" variant="link" />
            ) : null}
          </>
        }
      >
        <Bento>
          <BentoCell span={12} icon="package" title={t('ways.packs.indexTitle')} note={t('ways.packs.note')}>
            <PackStrip web={(['P1', 'P2', 'P3', 'P4'] as const).map(stripItem)} app={[stripItem('P5')]} featured="P2" />
          </BentoCell>
        </Bento>
        <PackCompare
          columns={columns}
          labels={{
            caption: t('compare.caption'),
            tabs: t('compare.tabs'),
            pack: t('compare.pack'),
            includes: t('compare.includes'),
            forWhom: t('compare.forWhom'),
            weeks: t('compare.weeks'),
            price: t('compare.price'),
            request: t('compare.request'),
            option: t('compare.option'),
          }}
          hash={anchor('packs')}
        />
        <Bento>
          <BentoCell span={12} icon="sparkles" title={t('extras.title')} note={t('extras.lead')}>
            <ExtraList items={extras} />
          </BentoCell>
        </Bento>
      </WaySection>

      <WaySection
        id={anchor('hiring')}
        lead={t('ways.hiring.lead')}
        tail={t('ways.hiring.accent')}
        text={hiringText}
      >
        <Bento>
          <BentoCell span={7} icon="briefcase" title={t('ways.hiring.stackTitle')}>
            <CellText>{t('ways.hiring.stack')}</CellText>
            <ArrowLink href="/sobre-mi#stack" emphasis="strong">
              {t('ways.hiring.stackLink')}
            </ArrowLink>
          </BentoCell>
          <BentoCell span={5} tone="tint" icon="user" title={t('ways.hiring.cardTitle')}>
            <HiringCard
              labels={{
                title: t('ways.hiring.cardTitle'),
                cv: t('hiringCard.cv'),
                book: actions('book20'),
                assistant: t('hiringCard.assistant'),
                linkedin: t('hiringCard.linkedin'),
                email: t('hiringCard.email'),
                copy: t('hiringCard.copy'),
                copied: t('hiringCard.copied'),
                failed: t('hiringCard.failed'),
              }}
              cv={cv.ready ? (cv.value as Href) : undefined}
              book={booking}
              assistant="/chat?case=recruiter"
              linkedin={facts.linkedinUrl as Href | undefined}
              email={facts.email}
            />
          </BentoCell>
        </Bento>
      </WaySection>

      <PageSection id="como-trabajo" lead={t('process.title')} tail={t('process.accent')}>
        <ProcessSteps steps={processSteps} />
      </PageSection>

      <PageSection
        id="pruebas"
        lead={t('proofs.title')}
        tail={t('proofs.accent')}
        aside={
          <ArrowLink href="/proyectos" emphasis="strong">
            {t('proofs.all')}
          </ArrowLink>
        }
      >
        <div className={styles.projects}>
          {tourSheets.map((sheet) => (
            <ProjectCard
              key={sheet.slug}
              slug={sheet.slug}
              name={sheet.name}
              lead={datoText(sheet.texts[locale].oneLiner)}
              kind={sheet.type}
              kindLabel={projectsT(`kind.${sheet.type}`)}
              art={projectArt(sheet.art, env.client.NEXT_PUBLIC_HERO_MEDIA_VERSION)}
              href={projectHref(sheet.slug)}
              linkLabel={projectsT('viewProject')}
              linkName={projectsT('viewProjectNamed', { name: sheet.name })}
            />
          ))}
        </div>
      </PageSection>

      <PageSection id="resumen" lead={t('facts.title')}>
        <FactList facts={factItems} />
      </PageSection>

      <PageSection id="preguntas" lead={t('faq.title')} tail={t('faq.accent')}>
        <div className={styles.faqs}>
          {(['hourly', 'fixed', 'packs', 'hiring'] as const).map((code) => {
            const entries = faq(code);
            return entries.length > 0 ? (
              <div key={code} className={styles.faqGroup}>
                <h3 className={styles.faqTitle}>{t(`faq.ways.${code}`)}</h3>
                <Faq items={entries} jsonLd={false} />
              </div>
            ) : null;
          })}
        </div>
        <FaqJsonLd items={allFaq} />
      </PageSection>

      <ClosingCompact
        lead={t('closing.lead')}
        tail={t('closing.accent')}
        primary={
          <Button href="/chat?case=client" icon="message-circle">
            {actions('askAssistant')}
          </Button>
        }
        moreLabel={t('closing.more')}
      />

      <StickyCtaBar
        watch={anchor('packs')}
        label={t('sticky.label')}
        whatsapp={hasWhatsapp ? whatsappPacks : undefined}
        proposal="/propuesta"
        labels={{ whatsapp: t('sticky.whatsapp'), proposal: t('sticky.proposal') }}
      />
      <JsonLd data={graphOf(...nodes)} />
    </>
  );
}
